"""POST /generate-backlog - generates backlog epics from proposal text."""
import logging
from fastapi import APIRouter, HTTPException

from schemas.backlog import BacklogRequest, BacklogResponse, EpicItem, SubEpicItem, UserStoryItem, TaskItem

logger = logging.getLogger(__name__)

router = APIRouter()


def _epic_to_item(epic):
    """Convert llms EpicModel to EpicItem schema."""
    sub_epics = []
    for se in getattr(epic, "sub_epics", []) or []:
        stories = []
        for us in getattr(se, "user_stories", []) or []:
            tasks = [
                TaskItem(
                    title=t.title,
                    description=getattr(t, "description", "") or "",
                    status=getattr(t, "status", "pending") or "pending",
                    ai=getattr(t, "ai", True),
                )
                for t in getattr(us, "tasks", []) or []
            ]
            stories.append(
                UserStoryItem(
                    title=us.title,
                    description=getattr(us, "description"),
                    tasks=tasks,
                    ai=getattr(us, "ai", True),
                )
            )
        sub_epics.append(
            SubEpicItem(
                title=se.title,
                description=getattr(se, "description"),
                user_stories=stories,
                ai=getattr(se, "ai", True),
            )
        )
    return EpicItem(
        title=epic.title,
        description=getattr(epic, "description"),
        sub_epics=sub_epics,
        ai=getattr(epic, "ai", True),
    )


@router.post("", response_model=BacklogResponse)
def generate_backlog(req: BacklogRequest):
    """Generate backlog epics. Prefer part1_json; fallback to proposal_text."""
    try:
        from llms.backlog_llm import run_backlog_pipeline

        proposal_text = (req.proposal_text or "").strip() if req.proposal_text else None
        part1_json = (req.part1_json or "").strip() if req.part1_json else None
        if not part1_json and not proposal_text:
            return BacklogResponse()

        context = {"proposal_text": proposal_text or ""}
        backlog_model = run_backlog_pipeline(
            proposal_text=proposal_text,
            context=context,
            part1_json=part1_json,
        )
        epics = [ _epic_to_item(e) for e in getattr(backlog_model, "epics", []) or [] ]
        return BacklogResponse(epics=epics)
    except OSError as e:
        if "cublas" in str(e).lower() or "winerror 193" in str(e).lower():
            logger.exception("PyTorch CUDA DLL error on Windows")
            raise HTTPException(
                503,
                "PyTorch CUDA mismatch. Run with venv: python -m uvicorn main:app --port 8002 --reload. Or reinstall: pip install torch --index-url https://download.pytorch.org/whl/cu128",
            )
        raise HTTPException(500, str(e))
    except Exception as e:
        logger.exception("generate-backlog failed")
        raise HTTPException(500, str(e))
