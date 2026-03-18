"""Request/response schemas for generate-overview."""
from pydantic import BaseModel, Field
from typing import List, Optional


class OverviewRequest(BaseModel):
    proposal_text: str


class OverviewGoal(BaseModel):
    title: str
    role: str


class OverviewTimelineGoal(BaseModel):
    title: str


class OverviewTimelineWeek(BaseModel):
    week_number: int
    goals: List[OverviewTimelineGoal] = Field(default_factory=list)


class OverviewResponse(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    features: List[str] = Field(default_factory=list)
    roles: List[str] = Field(default_factory=list)
    goals: List[OverviewGoal] = Field(default_factory=list)
    timeline: List[OverviewTimelineWeek] = Field(default_factory=list)
