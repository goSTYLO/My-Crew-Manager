import threading
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from langchain_huggingface import HuggingFacePipeline
try:
    from transformers import BitsAndBytesConfig
except Exception:
    BitsAndBytesConfig = None

MODEL_ID = "unsloth/mistral-7b-instruct-v0.3-bnb-4bit"

# Global variables for singleton pattern
_model_instance = None
_backlog_model_instance = None
_model_lock = threading.Lock()

def _create_llm_pipeline() -> HuggingFacePipeline:
    """Create a new LLM pipeline instance. Internal helper function."""
    print("Loading LLM model...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)

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
        if quant_cfg is not None:
            # CUDA with 4-bit (requires bitsandbytes, best on Linux)
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                device_map="auto",
                trust_remote_code=True,
                quantization_config=quant_cfg,
            )
        else:
            # CUDA without bitsandbytes: load then move explicitly to GPU
            model = AutoModelForCausalLM.from_pretrained(
                MODEL_ID,
                device_map=None,
                dtype=torch.float16,
                trust_remote_code=True,
            ).to("cuda")
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=1024,
            temperature=0.7,
            do_sample=True,
            return_full_text=False,
        )
    else:
        # CPU fallback (slower). Avoid 4-bit config on CPU.
        model = AutoModelForCausalLM.from_pretrained(
            MODEL_ID,
            device_map=None,
            dtype=torch.float32,
            trust_remote_code=True,
        )
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=512,
            temperature=0.7,
            do_sample=True,
            return_full_text=False,
        )
    
    return HuggingFacePipeline(pipeline=pipe)

def get_cached_llm() -> HuggingFacePipeline:
    """
    Get or create a cached LLM instance for project generation.
    Thread-safe lazy loading - model is loaded only once per server lifetime.
    """
    global _model_instance
    
    if _model_instance is not None:
        return _model_instance
    
    with _model_lock:
        # Double-check pattern: another thread might have created it while we waited
        if _model_instance is not None:
            return _model_instance
        
        _model_instance = _create_llm_pipeline()
        print("Project LLM model loaded and cached successfully")
        return _model_instance

def get_cached_backlog_llm() -> HuggingFacePipeline:
    """
    Get or create a separate cached LLM instance for backlog generation.
    This ensures backlog generation doesn't interfere with project generation.
    Thread-safe lazy loading - model is loaded only once per server lifetime.
    """
    global _backlog_model_instance
    
    if _backlog_model_instance is not None:
        return _backlog_model_instance
    
    with _model_lock:
        # Double-check pattern: another thread might have created it while we waited
        if _backlog_model_instance is not None:
            return _backlog_model_instance
        
        _backlog_model_instance = _create_llm_pipeline()
        print("Backlog LLM model loaded and cached successfully")
        return _backlog_model_instance

def clear_cache():
    """
    Clear the cached model instances. Useful for testing or memory management.
    """
    global _model_instance, _backlog_model_instance
    with _model_lock:
        _model_instance = None
        _backlog_model_instance = None
        print("LLM cache cleared")

def clear_backlog_cache():
    """
    Clear only the backlog model cache. Useful for troubleshooting backlog issues.
    """
    global _backlog_model_instance
    with _model_lock:
        _backlog_model_instance = None
        print("Backlog LLM cache cleared")
