# backend/app/models/tracking.py
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from app.schemas.tracking import (
    CheckInPlannedPayments,
    CheckInSpendingVsPlan,
    CheckInMoodScore,
    GoalProgressSource,
)


class GoalProgress(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    goal_id: UUID = Field(foreign_key="goal.id", index=True)
    current_balance: float
    source: GoalProgressSource
    note: Optional[str] = None
    recorded_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="goal_progress")
    goal: "Goal" = Relationship(back_populates="progress_records")


class CheckIn(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    completed_at: datetime = Field(default_factory=datetime.utcnow)
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    made_planned_payments: CheckInPlannedPayments
    spending_vs_plan: CheckInSpendingVsPlan
    mood_score: CheckInMoodScore
    comment: Optional[str] = None

    # Relationships
    user: "User" = Relationship(back_populates="check_ins")
