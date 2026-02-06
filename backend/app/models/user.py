# app/models/user.py
from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field, Relationship

from app.models.action_plan import ActionPlan
from app.models.tracking import GoalProgress, CheckIn
from app.models.notification import NudgeSchedule
from app.models.goal import Goal


class User(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(index=True, unique=True)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    verification_token: Optional[str] = Field(default=None, index=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    profile: Optional["Profile"] = Relationship(back_populates="user")
    action_plans: List[ActionPlan] = Relationship(back_populates="user")
    goal_progress: List["GoalProgress"] = Relationship(back_populates="user")
    check_ins: List["CheckIn"] = Relationship(back_populates="user")
    nudge_schedules: List["NudgeSchedule"] = Relationship(back_populates="user")
    goals: List["Goal"] = Relationship(back_populates="user")


class Profile(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    full_name: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    age_range: Optional[str] = None
    employment_status: Optional[str] = None
    reminder_frequency: Optional[str] = "weekly"
    preferred_checkin_day_of_week: Optional[int] = None
    persona_hint: Optional[str] = None

    user: User = Relationship(back_populates="profile")
