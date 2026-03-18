"""Request/response schemas for generate-backlog."""
from pydantic import BaseModel, Field
from typing import List, Optional


class BacklogRequest(BaseModel):
    proposal_text: str


class TaskItem(BaseModel):
    title: str
    description: str = ""
    status: str = "pending"
    ai: bool = True


class UserStoryItem(BaseModel):
    title: str
    description: Optional[str] = None
    tasks: List[TaskItem] = Field(default_factory=list)
    ai: bool = True


class SubEpicItem(BaseModel):
    title: str
    description: Optional[str] = None
    user_stories: List[UserStoryItem] = Field(default_factory=list)
    ai: bool = True


class EpicItem(BaseModel):
    title: str
    description: Optional[str] = None
    sub_epics: List[SubEpicItem] = Field(default_factory=list)
    ai: bool = True


class BacklogResponse(BaseModel):
    epics: List[EpicItem] = Field(default_factory=list)
