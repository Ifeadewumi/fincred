# backend/app/schemas/education.py
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import Field
from sqlmodel import SQLModel


# --- Enums for EducationSnippet ---
class EducationTopic(str, Enum):
    DEBT_METHODS = "debt_methods"
    EMERGENCY_FUND = "emergency_fund"
    FIRE_BASICS = "fire_basics"
    SAVINGS_STRATEGIES = "savings_strategies"
    INVESTING_BASICS = "investing_basics"


class EducationContextFeasibility(str, Enum):
    COMFORTABLE = "Comfortable"
    TIGHT = "Tight"
    UNREALISTIC = "Unrealistic"


# --- Schemas for EducationSnippet ---
class EducationSnippetBase(SQLModel):
    topic: EducationTopic
    short_title: str
    content: str
    context_goal_type: Optional[str] = None # Corresponds to GoalType, but as string for flexibility
    context_feasibility: Optional[EducationContextFeasibility] = None


class EducationSnippetCreate(EducationSnippetBase):
    pass


class EducationSnippetRead(EducationSnippetBase):
    id: UUID
    created_at: datetime
    updated_at: datetime


class EducationSnippetUpdate(SQLModel):
    topic: Optional[EducationTopic] = None
    short_title: Optional[str] = None
    content: Optional[str] = None
    context_goal_type: Optional[str] = None
    context_feasibility: Optional[EducationContextFeasibility] = None
