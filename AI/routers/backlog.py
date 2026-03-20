"""POST /generate-backlog - generates backlog epics from proposal text."""
import logging

from fastapi import APIRouter, HTTPException

from generated_parsers import parse_backlog_text, part1_json_string_to_overview_dict
from notebook_step_inference import generate_backlog_from_part1
from schemas.backlog import BacklogRequest, BacklogResponse, EpicItem, SubEpicItem, UserStoryItem, TaskItem

logger = logging.getLogger(__name__)

router = APIRouter()


def _epic_dict_to_item(ep: dict) -> EpicItem:
    """Convert parse_backlog_text epic dict to EpicItem schema."""
    sub_epics = []
    for se in ep.get("sub_epics") or []:
        stories = []
        for us in se.get("user_stories") or []:
            tasks = [
                TaskItem(
                    title=t.get("title", "") or "",
                    description=(t.get("description") or "") if isinstance(t, dict) else "",
                    status=(t.get("status", "pending") or "pending") if isinstance(t, dict) else "pending",
                    ai=t.get("ai", True) if isinstance(t, dict) else True,
                )
                for t in us.get("tasks") or []
            ]
            stories.append(
                UserStoryItem(
                    title=us.get("title", "") or "",
                    description=us.get("description") if isinstance(us, dict) else None,
                    tasks=tasks,
                    ai=us.get("ai", True) if isinstance(us, dict) else True,
                )
            )
        sub_epics.append(
            SubEpicItem(
                title=se.get("title", "") or "",
                description=se.get("description") if isinstance(se, dict) else None,
                user_stories=stories,
                ai=se.get("ai", True) if isinstance(se, dict) else True,
            )
        )
    return EpicItem(
        title=ep.get("title", "") or "",
        description=ep.get("description") if isinstance(ep, dict) else None,
        sub_epics=sub_epics,
        ai=ep.get("ai", True) if isinstance(ep, dict) else True,
    )


@router.post("", response_model=BacklogResponse)
def generate_backlog(req: BacklogRequest):
    """Generate backlog epics. Prefer part1_json; fallback to proposal_text."""
    try:
        proposal_text = (req.proposal_text or "").strip() if req.proposal_text else None
        part1_json = (req.part1_json or "").strip() if req.part1_json else None
        if not part1_json and not proposal_text:
            return BacklogResponse()

        if part1_json:
            overview_from_node = part1_json_string_to_overview_dict(part1_json)
            part1_input = overview_from_node if overview_from_node is not None else part1_json
        else:
            part1_input = proposal_text or ""

        raw_text = generate_backlog_from_part1(part1_input)
        parsed = parse_backlog_text(raw_text)
        epics = [_epic_dict_to_item(e) for e in parsed.get("epics") or []]
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
