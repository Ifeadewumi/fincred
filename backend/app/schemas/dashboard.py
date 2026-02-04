# backend/app/schemas/dashboard.py
"""Dashboard response schemas."""
from datetime import date
from typing import List
from uuid import UUID

from pydantic import Field
from sqlmodel import SQLModel

from app.schemas.goal import GoalType, GoalPriority
from app.schemas.tracking import ProgressStatus


class DashboardGoal(SQLModel):
    """Goal summary for dashboard display."""
    id: UUID
    name: str = Field(max_length=100)
    type: GoalType
    target_amount: float
    current_balance: float = Field(default=0.0)
    progress_percentage: float = Field(
        default=0.0,
        description="Progress as percentage (0-100)"
    )
    status_label: ProgressStatus
    target_date: date
    priority: GoalPriority


class DashboardStats(SQLModel):
    """Summary statistics for dashboard."""
    total_goals: int = Field(description="Total number of goals")
    active_goals: int = Field(description="Number of active goals")
    completed_goals: int = Field(description="Number of completed goals")
    total_saved: float = Field(description="Total amount saved across all goals")
    current_streak: int = Field(description="Current check-in streak in weeks")
    longest_streak: int = Field(description="Longest check-in streak in weeks")


class DashboardResponse(SQLModel):
    """Complete dashboard response."""
    goals: List[DashboardGoal] = Field(
        description="Top goals with progress information"
    )
    stats: DashboardStats = Field(
        description="Summary statistics"
    )
    recent_milestones: List[str] = Field(
        default=[],
        description="Recently achieved milestones (e.g., 'Reached 50% on Emergency Fund')"
    )
