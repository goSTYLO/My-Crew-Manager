"""POST /generate-overview - generates project overview from proposal text."""
import logging
from fastapi import APIRouter, HTTPException

from schemas.overview import OverviewRequest, OverviewResponse, OverviewGoal, OverviewTimelineGoal, OverviewTimelineWeek

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("", response_model=OverviewResponse)
def generate_overview(req: OverviewRequest):
    """Generate project overview (title, summary, features, roles, goals, timeline) from proposal text."""
    try:
        from llms.project_llm import run_pipeline_from_text, model_to_dict

        proposal_text = (req.proposal_text or "").strip()
        if not proposal_text:
            return OverviewResponse()

        project_model = run_pipeline_from_text(proposal_text)
        data = model_to_dict(project_model)

        goals = []
        for g in data.get("goals") or []:
            if isinstance(g, dict):
                goals.append(OverviewGoal(title=g.get("title", ""), role=g.get("role", "")))
            else:
                goals.append(OverviewGoal(title=str(g), role=""))

        timeline = []
        for w in data.get("timeline") or []:
            week_num = w.get("week_number", 0) if isinstance(w, dict) else 0
            goals_list = w.get("goals", []) if isinstance(w, dict) else []
            timeline.append(
                OverviewTimelineWeek(
                    week_number=week_num,
                    goals=[OverviewTimelineGoal(title=g if isinstance(g, str) else str(g)) for g in goals_list],
                )
            )

        return OverviewResponse(
            title=data.get("title"),
            summary=data.get("summary"),
            features=data.get("features") or [],
            roles=data.get("roles") or [],
            goals=goals,
            timeline=timeline,
        )
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
