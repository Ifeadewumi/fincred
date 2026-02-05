# backend/app/api/v0/routers/goal_progress.py
"""Goal progress tracking endpoints."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select

from app.api.v0.deps import get_current_user
from app.db.session import get_session
from app.models.goal import Goal
from app.models.tracking import GoalProgress
from app.models.user import User
from app.schemas.tracking import (
    GoalProgressCreate,
    GoalProgressRead,
    GoalProgressSource,
)
from app.services.progress_service import (
    detect_milestones_reached,
    get_latest_progress,
)

router = APIRouter(prefix="/goals")


@router.get("/{goal_id}/progress", response_model=List[GoalProgressRead])
def list_goal_progress(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """
    List historical progress records for a goal.
    
    Returns progress records in reverse chronological order (newest first).
    """
    # Verify goal exists and belongs to user
    goal = session.get(Goal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Fetch progress records with pagination
    statement = (
        select(GoalProgress)
        .where(GoalProgress.goal_id == goal_id)
        .order_by(GoalProgress.recorded_at.desc())
        .offset(offset)
        .limit(limit)
    )
    progress_records = session.exec(statement).all()
    
    return [GoalProgressRead.model_validate(p) for p in progress_records]


@router.post("/{goal_id}/progress", response_model=dict, status_code=status.HTTP_201_CREATED)
def create_progress_record(
    goal_id: UUID,
    progress_data: GoalProgressCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Create a new progress record for a goal.
    
    Validates that the goal exists and belongs to the current user.
    Detects and returns any milestones achieved with this update.
    """
    # Verify goal exists and belongs to user
    goal = session.get(Goal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Validate that goal_id in path matches goal_id in body
    if progress_data.goal_id != goal_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Goal ID in path must match goal ID in request body"
        )
    
    # Get previous balance for milestone detection
    previous_progress = get_latest_progress(goal_id, session)
    old_balance = previous_progress.current_balance if previous_progress else 0.0
    
    # Create progress record
    progress_record = GoalProgress(
        **progress_data.model_dump(),
        user_id=current_user.id
    )
    session.add(progress_record)
    session.commit()
    session.refresh(progress_record)
    
    # Detect milestones
    milestones_reached = detect_milestones_reached(
        goal_id=goal_id,
        new_balance=progress_data.current_balance,
        old_balance=old_balance,
        target_amount=goal.target_amount
    )
    
    # Build response
    response = {
        "progress": GoalProgressRead.model_validate(progress_record),
        "milestones_reached": milestones_reached,
        "message": f"Progress updated successfully"
    }
    
    if milestones_reached:
        milestone_str = ", ".join(milestones_reached)
        response["message"] += f". Milestones reached: {milestone_str}!"
    
    return response
