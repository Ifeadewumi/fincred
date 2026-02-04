# app/models/goal.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship

from app.schemas.goal import GoalType, GoalPriority, GoalStatus
from app.models.action_plan import ActionPlan
from app.models.tracking import GoalProgress


class Goal(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    type: GoalType
    name: str
    target_amount: float
    target_date: datetime
    priority: GoalPriority
    status: GoalStatus = GoalStatus.ACTIVE
    primary_flag: bool = False
    why_text: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="goals")
    action_plans: List[ActionPlan] = Relationship(back_populates="goal")
    progress_records: List["GoalProgress"] = Relationship(back_populates="goal")
