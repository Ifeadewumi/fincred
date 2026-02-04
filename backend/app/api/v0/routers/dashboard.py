# backend/app/api/v0/routers/dashboard.py
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session, select

from app.api.v0.deps import get_current_user
from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalRead, GoalStatus # Import GoalStatus
from app.db.session import get_session

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=List[GoalRead]) # Return a list of GoalRead
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Retrieves a compact view of the user's top goals and current status for the dashboard.
    For MVP, this returns a list of active goals with their basic details.
    """
    statement = (
        select(Goal)
        .where(Goal.user_id == current_user.id)
        .where(Goal.status == GoalStatus.ACTIVE) # Use Enum for status
        .order_by(Goal.priority.desc(), Goal.target_date.asc()) # Order by priority (High first), then earliest target date
        .limit(5) # Limit to top 5 goals for a compact dashboard
    )
    goals = db.exec(statement).all()

    # The ideal dashboard would also fetch latest progress for each goal,
    # and compute a status_label (on/off track). This is more complex
    # and can be added later by extending this endpoint or a dedicated service.
    return [GoalRead.model_validate(g) for g in goals]
