# backend/app/schemas/notification.py
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import Field
from sqlmodel import SQLModel


# --- Enums for NudgeSchedule ---
class NotificationType(str, Enum):
    WEEKLY_SUMMARY = "weekly_summary"
    PRE_TRANSFER_REMINDER = "pre_transfer_reminder"
    CHECKIN_REMINDER = "checkin_reminder"
    GOAL_PROGRESS_UPDATE = "goal_progress_update" # Example of another type


class NotificationChannel(str, Enum):
    EMAIL = "email"
    PUSH = "push"


class NotificationStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    CANCELLED = "cancelled"


# --- Schemas for NudgeSchedule ---
class NudgeScheduleBase(SQLModel):
    action_plan_id: Optional[UUID] = None # FK to ActionPlan, nullable if generic notification
    type: NotificationType
    channel: NotificationChannel
    next_send_at: datetime
    last_sent_at: Optional[datetime] = None
    status: NotificationStatus = NotificationStatus.ACTIVE


class NudgeScheduleCreate(NudgeScheduleBase):
    pass


class NudgeScheduleRead(NudgeScheduleBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class NudgeScheduleUpdate(SQLModel):
    action_plan_id: Optional[UUID] = None
    type: Optional[NotificationType] = None
    channel: Optional[NotificationChannel] = None
    next_send_at: Optional[datetime] = None
    last_sent_at: Optional[datetime] = None
    status: Optional[NotificationStatus] = None
