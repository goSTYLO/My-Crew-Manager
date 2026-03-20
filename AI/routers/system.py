"""System endpoints for AI cache and runtime housekeeping."""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class CleanupIntervalRequest(BaseModel):
    interval_seconds: int


@router.get("/memory-usage")
def memory_usage():
    try:
        from llms.llm_cache import get_memory_usage
        return get_memory_usage()
    except Exception as e:
        logger.exception("memory-usage failed")
        raise HTTPException(500, str(e))


@router.post("/clear-cache")
def clear_cache():
    try:
        from llms.llm_cache import clear_cache_and_free_memory, get_memory_usage
        memory_before = get_memory_usage()
        clear_cache_and_free_memory()
        memory_after = get_memory_usage()
        return {
            "message": "LLM cache cleared successfully",
            "memory_before": memory_before,
            "memory_after": memory_after,
            "memory_freed_mb": memory_before.get("allocated_mb", 0) - memory_after.get("allocated_mb", 0),
        }
    except Exception as e:
        logger.exception("clear-cache failed")
        raise HTTPException(500, str(e))


@router.post("/start-auto-cleanup")
def start_auto_cleanup():
    try:
        from llms.llm_cache import start_auto_cleanup
        start_auto_cleanup()
        return {
            "message": "Auto-cleanup started successfully",
            "cleanup_interval_seconds": 1800,
        }
    except Exception as e:
        logger.exception("start-auto-cleanup failed")
        raise HTTPException(500, str(e))


@router.post("/stop-auto-cleanup")
def stop_auto_cleanup():
    try:
        from llms.llm_cache import stop_auto_cleanup
        stop_auto_cleanup()
        return {
            "message": "Auto-cleanup stopped successfully",
        }
    except Exception as e:
        logger.exception("stop-auto-cleanup failed")
        raise HTTPException(500, str(e))


@router.post("/set-cleanup-interval")
def set_cleanup_interval(payload: CleanupIntervalRequest):
    try:
        if payload.interval_seconds <= 0:
            raise HTTPException(400, "interval_seconds must be > 0")
        from llms.llm_cache import set_cleanup_interval
        set_cleanup_interval(payload.interval_seconds)
        return {
            "message": "Auto-cleanup interval updated successfully",
            "cleanup_interval_seconds": payload.interval_seconds,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("set-cleanup-interval failed")
        raise HTTPException(500, str(e))
