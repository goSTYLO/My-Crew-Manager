"""POST /generate-overview - generates project overview from proposal text."""
import logging

from fastapi import APIRouter, HTTPException

from generated_parsers import parse_overview_text
from notebook_step_inference import generate_overview_proposal
from schemas.overview import (
    OverviewRequest,
    OverviewResponse,
    OverviewGoal,
    OverviewTimelineGoal,
    OverviewTimelineWeek,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _overview_dict_to_response(data: dict) -> OverviewResponse:
    """Map parse_overview_text output to Pydantic response (same shape as former model_to_dict path)."""
    goals = []
    for g in data.get("goals") or []:
        if isinstance(g, dict):
            role = g.get("role")
            goals.append(
                OverviewGoal(
                    title=g.get("title", "") or "",
                    role="" if role is None else str(role),
                )
            )
        else:
            goals.append(OverviewGoal(title=str(g), role=""))

    timeline = []
    for w in data.get("timeline") or []:
        week_num = w.get("week_number", 0) if isinstance(w, dict) else 0
        goals_list = w.get("goals", []) if isinstance(w, dict) else []
        tl_goals = []
        for g in goals_list:
            if isinstance(g, str):
                tl_goals.append(OverviewTimelineGoal(title=g))
            elif isinstance(g, dict):
                tl_goals.append(OverviewTimelineGoal(title=(g.get("title") or "") or ""))
            else:
                tl_goals.append(OverviewTimelineGoal(title=str(g)))
        timeline.append(OverviewTimelineWeek(week_number=week_num, goals=tl_goals))

    return OverviewResponse(
        title=data.get("title"),
        summary=data.get("summary"),
        features=data.get("features") or [],
        roles=data.get("roles") or [],
        goals=goals,
        timeline=timeline,
    )


@router.post("", response_model=OverviewResponse)
def generate_overview(req: OverviewRequest):
    """Generate project overview (title, summary, features, roles, goals, timeline) from proposal text."""
    try:
        proposal_text = (req.proposal_text or "").strip()
        if not proposal_text:
            return OverviewResponse()

        raw_text = generate_overview_proposal(proposal_text)
        data = parse_overview_text(raw_text)
        return _overview_dict_to_response(data)
    except OSError as e:
        if "cublas" in str(e).lower() or "winerror 193" in str(e).lower():
            logger.exception("PyTorch CUDA DLL error on Windows")
            raise HTTPException(
                503,
                "PyTorch CUDA mismatch. Run with venv: python -m uvicorn main:app --port 8002 --reload. Or reinstall: pip install torch --index-url https://download.pytorch.org/whl/cu128",
            )
        raise HTTPException(500, str(e))
    except Exception as e:
        logger.exception("generate-overview failed")
        raise HTTPException(500, str(e))
