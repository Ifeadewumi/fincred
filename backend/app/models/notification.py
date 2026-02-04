# backend/app/models/notification.py
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel

from app.schemas.notification import (
    NotificationType,
    NotificationChannel,
    NotificationStatus,
)


class NudgeSchedule(SQLModel, table=True):
    id: Optional[UUID] = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="user.id", index=True)
    action_plan_id: Optional[UUID] = Field(default=None, foreign_key="actionplan.id", index=True) # Optional link to action plan
    type: NotificationType
    channel: NotificationChannel
    next_send_at: datetime
    last_sent_at: Optional[datetime] = None
    status: NotificationStatus = NotificationStatus.ACTIVE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: "User" = Relationship(back_populates="nudge_schedules")
    action_plan: Optional["ActionPlan"] = Relationship(back_populates="nudge_schedules")
