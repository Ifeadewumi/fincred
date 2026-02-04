# backend/app/schemas/action_plan.py
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import Field
from sqlmodel import SQLModel


# Enums for ActionPlan fields
class ActionPlanType(str, Enum):
    AUTOMATED_TRANSFER = "automated_transfer"
    MANUAL_HABIT = "manual_habit"


class ActionPlanFrequency(str, Enum):
    MONTHLY = "monthly"
    BIWEEKLY = "biweekly"
    WEEKLY = "weekly"


class ActionPlanBase(SQLModel):
    goal_id: UUID
    type: ActionPlanType
    amount: float = Field(ge=0)
    frequency: ActionPlanFrequency
    day_of_period: Optional[int] = None # e.g., day of month or weekday, 1-31 or 1-7
    is_confirmed_set_up: bool = False


class ActionPlanCreate(ActionPlanBase):
    pass


class ActionPlanRead(ActionPlanBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class ActionPlanUpdate(SQLModel):
    type: Optional[ActionPlanType] = None
    amount: Optional[float] = Field(default=None, ge=0)
    frequency: Optional[ActionPlanFrequency] = None
    day_of_period: Optional[int] = None
    is_confirmed_set_up: Optional[bool] = None
