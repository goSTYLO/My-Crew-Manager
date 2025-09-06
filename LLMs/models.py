from pydantic import BaseModel, Field
from typing import List, Optional

class TaskModel(BaseModel):
    title: str
    description: str
    status: str = "pending" # Default status

class UserStoryModel(BaseModel):
    title: str
    description: Optional[str] = None
    acceptance_criteria: List[str] = Field(default_factory=list)
    tasks: List[TaskModel] = Field(default_factory=list)

class SubEpicModel(BaseModel):
    title: str
    description: Optional[str] = None
    user_stories: List[UserStoryModel] = Field(default_factory=list)

class EpicModel(BaseModel):
    title: str
    description: Optional[str] = None
    sub_epics: List[SubEpicModel] = Field(default_factory=list)

class TeamMemberModel(BaseModel):
    role: str

class ProjectSummaryModel(BaseModel):
    project_title: str
    project_summary: str
    overarching_goals: List[str] = Field(default_factory=list)

class TeamMembersOutputModel(BaseModel): # To encapsulate the list of members from LLM output
    team_members: List[TeamMemberModel] = Field(default_factory=list)

class EpicListOutputModel(BaseModel):
    epics: List[EpicModel] = Field(default_factory=list)

class SubEpicListOutputModel(BaseModel):
    sub_epics: List[SubEpicModel] = Field(default_factory=list)

class UserStoryListOutputModel(BaseModel):
    user_stories: List[UserStoryModel] = Field(default_factory=list)
        
class TaskListOutputModel(BaseModel):
    tasks: List[TaskModel] = Field(default_factory=list)

class TimelineTaskModel(BaseModel):
    title: str

class TimelineWeekModel(BaseModel):
    week_number: int
    tasks: List[TimelineTaskModel] = Field(default_factory=list)

class ProjectModel(BaseModel): # Top-level model for the entire project
    title: Optional[str] = None
    summary: Optional[str] = None
    features: List[str] = Field(default_factory=list)
    roles: List[TeamMemberModel] = Field(default_factory=list)
    tasks: List[str] = Field(default_factory=list) # Renamed from initial_epics
    timeline: List[TimelineWeekModel] = Field(default_factory=list) # Renamed from epics
    epics: List[EpicModel] = Field(default_factory=list) # Re-added for hierarchical backlog
