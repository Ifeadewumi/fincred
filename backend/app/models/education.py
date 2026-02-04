# backend/app/models/education.py
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from app.schemas.education import EducationTopic, EducationContextFeasibility


class EducationSnippet(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    topic: EducationTopic
    short_title: str
    content: str
    context_goal_type: Optional[str] = None # Corresponds to GoalType, but as string for flexibility in the model
    context_feasibility: Optional[EducationContextFeasibility] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

