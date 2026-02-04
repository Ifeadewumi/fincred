# backend/app/schemas/tracking.py
from datetime import date, datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import Field
from sqlmodel import SQLModel


# --- Enums for GoalProgress ---
class GoalProgressSource(str, Enum):
    MANUAL_ENTRY = "manual_entry"
    DERIVED = "derived" # e.g., from external source or calculation


# --- Schemas for GoalProgress ---
class GoalProgressBase(SQLModel):
    goal_id: UUID
    current_balance: float = Field(ge=0)
    source: GoalProgressSource
    note: Optional[str] = None


class GoalProgressCreate(GoalProgressBase):
    pass


class GoalProgressRead(GoalProgressBase):
    id: UUID
    user_id: UUID
    recorded_at: datetime


class GoalProgressUpdate(SQLModel):
    current_balance: Optional[float] = Field(default=None, ge=0)
    source: Optional[GoalProgressSource] = None
    note: Optional[str] = None


# --- Enums for CheckIn ---
class CheckInPlannedPayments(str, Enum):
    YES = "yes"
    NO = "no"
    PARTIAL = "partial"


class CheckInSpendingVsPlan(str, Enum):
    UNDER = "under"
    ON = "on"
    OVER = "over"


class CheckInMoodScore(int, Enum):
    VERY_BAD = 1
    BAD = 2
    NEUTRAL = 3
    GOOD = 4
    VERY_GOOD = 5


# --- Schemas for CheckIn ---
class CheckInBase(SQLModel):
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    made_planned_payments: CheckInPlannedPayments
    spending_vs_plan: CheckInSpendingVsPlan
    mood_score: CheckInMoodScore
    comment: Optional[str] = None


class CheckInCreate(CheckInBase):
    pass


class CheckInRead(CheckInBase):
    id: UUID
    user_id: UUID
    completed_at: datetime


class CheckInUpdate(SQLModel):
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    made_planned_payments: Optional[CheckInPlannedPayments] = None
    spending_vs_plan: Optional[CheckInSpendingVsPlan] = None
    mood_score: Optional[CheckInMoodScore] = None
    comment: Optional[str] = None
