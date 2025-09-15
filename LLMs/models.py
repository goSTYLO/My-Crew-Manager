from pydantic import BaseModel, Field
from typing import List, Optional

# 🧩 Task Model
class TaskModel(BaseModel):
    title: str
    description: str = ""
    status: str = "pending"  # Default status
    ai: bool = True

# 🧩 User Story Model
class UserStoryModel(BaseModel):
    title: str
    description: Optional[str] = None
    acceptance_criteria: List[str] = Field(default_factory=list)
    tasks: List[TaskModel] = Field(default_factory=list)
    ai: bool = True

# 🧩 Sub-Epic Model
class SubEpicModel(BaseModel):
    title: str
    description: Optional[str] = None
    user_stories: List[UserStoryModel] = Field(default_factory=list)
    ai: bool = True

# 🧩 Epic Model
class EpicModel(BaseModel):
    title: str
    description: Optional[str] = None
    sub_epics: List[SubEpicModel] = Field(default_factory=list)
    ai: bool = True

# 🧩 Team Member Model
class TeamMemberModel(BaseModel):
    role: str

# 🧩 Project Summary Model
class ProjectSummaryModel(BaseModel):
    project_title: str
    project_summary: str
    overarching_goals: List[str] = Field(default_factory=list)

# 🧩 Output Wrappers
class TeamMembersOutputModel(BaseModel):
    team_members: List[TeamMemberModel] = Field(default_factory=list)

class EpicListOutputModel(BaseModel):
    epics: List[EpicModel] = Field(default_factory=list)

class SubEpicListOutputModel(BaseModel):
    sub_epics: List[SubEpicModel] = Field(default_factory=list)

class UserStoryListOutputModel(BaseModel):
    user_stories: List[UserStoryModel] = Field(default_factory=list)

class TaskListOutputModel(BaseModel):
    tasks: List[TaskModel] = Field(default_factory=list)

# 🧩 Timeline Models
class TimelineTaskModel(BaseModel):
    title: str

class TimelineWeekModel(BaseModel):
    week_number: int
    tasks: List[TimelineTaskModel] = Field(default_factory=list)

# 🧩 Top-Level Project Model
class ProjectModel(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    features: List[str] = Field(default_factory=list)
    roles: List[TeamMemberModel] = Field(default_factory=list)
    tasks: List[str] = Field(default_factory=list)  # High-level tasks
    timeline: List[TimelineWeekModel] = Field(default_factory=list)
    epics: List[EpicModel] = Field(default_factory=list)  # Hierarchical backlog