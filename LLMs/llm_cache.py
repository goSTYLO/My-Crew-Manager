import threading
import torch
import time
import gc
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
try:
    from transformers import BitsAndBytesConfig
except Exception:
    BitsAndBytesConfig = None

MODEL_ID = "unsloth/mistral-7b-instruct-v0.3-bnb-4bit"

# Global variables for singleton pattern
_model_instance = None
_model_lock = threading.Lock()

# Auto-cleanup variables
_last_activity_time = None
_cleanup_thread = None
_cleanup_interval = 1800  # 30 minutes in seconds
_cleanup_lock = threading.Lock()

def _create_llm_pipeline() -> HuggingFacePipeline:
    """Create a new LLM pipeline instance. Internal helper function."""
    print("🚀 [LLM Cache] Loading LLM model...")
    print(f"📦 [LLM Cache] Model ID: {MODEL_ID}")
    
    print("🔧 [LLM Cache] Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
    print("✅ [LLM Cache] Tokenizer loaded")

    use_cuda = torch.cuda.is_available()
    quant_cfg = None
    
    # Only try quantization if CUDA is available AND bitsandbytes is properly installed
    if use_cuda and BitsAndBytesConfig is not None:
        try:
            # Test if bitsandbytes is actually working
            import bitsandbytes as bnb
            # Try 4-bit quantization for speed/memory on GPU
            quant_cfg = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.float16,
            )
        except (ImportError, Exception) as e:
            print(f"Warning: bitsandbytes not available, falling back to standard loading: {e}")
            quant_cfg = None

    if use_cuda:
        print("🎮 [LLM Cache] CUDA available, loading model to GPU...")
        if quant_cfg is not None:
            print("⚡ [LLM Cache] Using 4-bit quantization for memory efficiency...")
            # CUDA with 4-bit (requires bitsandbytes, best on Linux)
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                device_map="auto",
                trust_remote_code=True,
                quantization_config=quant_cfg,
            )
            print("✅ [LLM Cache] Model loaded with 4-bit quantization")
        else:
            print("🔧 [LLM Cache] Loading model without quantization...")
            # CUDA without bitsandbytes: load then move explicitly to GPU
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                device_map=None,
                dtype=torch.float16,
                trust_remote_code=True,
            ).to("cuda")
            print("✅ [LLM Cache] Model loaded to GPU")
        print("🔧 [LLM Cache] Creating text generation pipeline...")
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=1024,
            temperature=0.7,
            do_sample=True,
            return_full_text=False,
        )
        print("✅ [LLM Cache] GPU pipeline created successfully")
    else:
        print("💻 [LLM Cache] CUDA not available, loading model to CPU...")
        # CPU fallback (slower). Avoid 4-bit config on CPU.
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            device_map=None,
            dtype=torch.float32,
            trust_remote_code=True,
        )
        print("✅ [LLM Cache] Model loaded to CPU")
        print("🔧 [LLM Cache] Creating text generation pipeline...")
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            return_full_text=False,
        )
        print("✅ [LLM Cache] CPU pipeline created successfully")
    
    print("🎉 [LLM Cache] LLM pipeline creation completed successfully!")
    return HuggingFacePipeline(pipeline=pipe)

def get_cached_llm() -> HuggingFacePipeline:
    """
    Get or create a cached LLM instance (shared for all operations).
    Thread-safe lazy loading - model is loaded only once per server lifetime.
    """
    global _model_instance
    
    print("🔍 [LLM Cache] get_cached_llm() called")
    
    # Update activity time whenever LLM is accessed
    _update_activity_time()
    
    if _model_instance is not None:
        print("✅ [LLM Cache] Returning existing cached model instance")
        return _model_instance
    
    print("⏳ [LLM Cache] No cached model found, creating new instance...")
    
    with _model_lock:
        # Double-check pattern: another thread might have created it while we waited
        if _model_instance is not None:
            print("✅ [LLM Cache] Another thread created model while waiting, returning existing instance")
            return _model_instance
        
        print("🚀 [LLM Cache] Creating new LLM pipeline...")
        _model_instance = _create_llm_pipeline()
        print("✅ [LLM Cache] LLM model loaded and cached successfully")
        return _model_instance

def get_cached_backlog_llm() -> HuggingFacePipeline:
    """
    Get cached LLM instance (same as get_cached_llm).
    Kept for backward compatibility.
    """
    print("🔍 [LLM Cache] get_cached_backlog_llm() called - delegating to get_cached_llm()")
    return get_cached_llm()

def clear_cache():
    """
    Clear the cached model instance. Useful for testing or memory management.
    """
    global _model_instance
    print("🧹 [LLM Cache] clear_cache() called")
    with _model_lock:
        if _model_instance is not None:
            print("🗑️ [LLM Cache] Clearing cached model instance")
            _model_instance = None
            print("✅ [LLM Cache] LLM cache cleared")
        else:
            print("ℹ️ [LLM Cache] No cached model to clear")

def clear_backlog_cache():
    """
    Clear cache (same as clear_cache, kept for compatibility).
    """
    print("🧹 [LLM Cache] clear_backlog_cache() called - delegating to clear_cache()")
    clear_cache()

def _update_activity_time():
    """Update the last activity time to current timestamp."""
    global _last_activity_time
    _last_activity_time = time.time()

def clear_cache_and_free_memory():
    """
    Clear the cached model instance and free GPU memory.
    This should be called when you want to free VRAM.
    """
    global _model_instance
    print("🧹 [LLM Cache] clear_cache_and_free_memory() called")
    
    with _model_lock:
        if _model_instance is not None:
            print("🗑️ [LLM Cache] Clearing model from GPU memory...")
            # Clear the model from GPU memory
            if hasattr(_model_instance, 'pipeline') and hasattr(_model_instance.pipeline, 'model'):
                print("🔧 [LLM Cache] Deleting pipeline model...")
                del _model_instance.pipeline.model
            if hasattr(_model_instance, 'pipeline') and hasattr(_model_instance.pipeline, 'tokenizer'):
                print("🔧 [LLM Cache] Deleting pipeline tokenizer...")
                del _model_instance.pipeline.tokenizer
            print("🔧 [LLM Cache] Deleting model instance...")
            del _model_instance
            _model_instance = None
            print("✅ [LLM Cache] Model instance cleared")
        else:
            print("ℹ️ [LLM Cache] No cached model to clear")
            
        # Force garbage collection and clear CUDA cache
        print("🧹 [LLM Cache] Running garbage collection...")
        gc.collect()
        if torch.cuda.is_available():
            print("🧹 [LLM Cache] Clearing CUDA cache...")
            torch.cuda.empty_cache()
            print("✅ [LLM Cache] GPU memory cleared and model unloaded")
        else:
            print("✅ [LLM Cache] CPU memory cleared and model unloaded")

def get_memory_usage():
    """
    Get current GPU memory usage in MB.
    """
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated() / 1024 / 1024
        reserved = torch.cuda.memory_reserved() / 1024 / 1024
        return {
            'allocated_mb': round(allocated, 2),
            'reserved_mb': round(reserved, 2),
            'available_mb': round(torch.cuda.get_device_properties(0).total_memory / 1024 / 1024 - reserved, 2)
        }
    return {'allocated_mb': 0, 'reserved_mb': 0, 'available_mb': 0}

def _auto_cleanup_worker():
    """Background worker that periodically checks for cleanup opportunities."""
    global _last_activity_time, _cleanup_interval
    
    print("🔄 [LLM Cache] Auto-cleanup worker started")
    
    while True:
        try:
            # Check every 30 seconds for more responsive cleanup
            time.sleep(30)
            
            with _cleanup_lock:
                if _last_activity_time is None:
                    continue
                    
                time_since_activity = time.time() - _last_activity_time
                
                # Log periodic status (every 5 minutes)
                if int(time_since_activity) % 300 == 0 and time_since_activity > 0:
                    print(f"⏰ [LLM Cache] Auto-cleanup check: {time_since_activity:.0f}s since last activity (cleanup at {_cleanup_interval}s)")
                
                # If no activity for the cleanup interval, clear the cache
                if time_since_activity >= _cleanup_interval:
                    print(f"🧹 [LLM Cache] Auto-cleanup triggered: No LLM activity for {time_since_activity:.0f} seconds, clearing cache...")
                    clear_cache_and_free_memory()
                    _last_activity_time = None  # Reset activity time
                    print("✅ [LLM Cache] Auto-cleanup completed")
                    
        except Exception as e:
            print(f"❌ [LLM Cache] Auto-cleanup worker error: {e}")
            time.sleep(30)  # Wait before retrying

def start_auto_cleanup():
    """
    Start the auto-cleanup background thread.
    This should be called once during Django startup.
    """
    global _cleanup_thread
    
    print("🚀 [LLM Cache] Starting auto-cleanup system...")
    
    with _cleanup_lock:
        if _cleanup_thread is None or not _cleanup_thread.is_alive():
            _cleanup_thread = threading.Thread(target=_auto_cleanup_worker, daemon=True)
            _cleanup_thread.start()
            print(f"✅ [LLM Cache] Auto-cleanup started (cleanup interval: {_cleanup_interval} seconds)")
        else:
            print("ℹ️ [LLM Cache] Auto-cleanup already running")

def stop_auto_cleanup():
    """
    Stop the auto-cleanup background thread.
    """
    global _cleanup_thread
    
    print("🛑 [LLM Cache] Stopping auto-cleanup system...")
    
    with _cleanup_lock:
        if _cleanup_thread is not None:
            # Note: We can't actually stop the thread cleanly since it's in a loop
            # The daemon=True flag ensures it will be killed when the main process exits
            _cleanup_thread = None
            print("✅ [LLM Cache] Auto-cleanup stopped")
        else:
            print("ℹ️ [LLM Cache] Auto-cleanup was not running")

def set_cleanup_interval(seconds):
    """
    Set the auto-cleanup interval in seconds.
    """
    global _cleanup_interval
    print(f"⚙️ [LLM Cache] Setting auto-cleanup interval to {seconds} seconds")
    _cleanup_interval = seconds
    print(f"✅ [LLM Cache] Auto-cleanup interval set to {seconds} seconds")
