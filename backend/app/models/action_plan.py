# backend/app/models/action_plan.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from app.schemas.action_plan import ActionPlanType, ActionPlanFrequency
from app.models.notification import NudgeSchedule


class ActionPlan(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    goal_id: UUID = Field(foreign_key="goal.id", index=True)
    type: ActionPlanType
    amount: float
    frequency: ActionPlanFrequency
    day_of_period: Optional[int] = None # e.g., day of month or weekday, 1-31 or 1-7
    is_confirmed_set_up: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="action_plans")
    goal: "Goal" = Relationship(back_populates="action_plans")
    nudge_schedules: List["NudgeSchedule"] = Relationship(back_populates="action_plan")
