# backend/app/api/v0/routers/dashboard.py
"""Dashboard endpoints with progress tracking and statistics."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select, func

from app.api.v0.deps import get_current_user
from app.db.session import get_session
from app.models.goal import Goal
from app.models.user import User
from app.schemas.dashboard import DashboardResponse, DashboardGoal, DashboardStats
from app.schemas.goal import GoalStatus
from app.services.progress_service import (
    get_latest_progress,
    calculate_progress_percentage,
    calculate_progress_status,
    calculate_streak,
    get_total_saved_across_goals,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Get dashboard summary with goals, progress, and statistics.
    
    Returns:
    - Top 5 active goals with progress information
    - Summary statistics (streaks, totals)
    - Recent milestones (placeholder for future implementation)
    """
    # Fetch top 5 active goals
    statement = (
        select(Goal)
        .where(Goal.user_id == current_user.id)
        .where(Goal.status == GoalStatus.ACTIVE)
        .order_by(Goal.priority.desc(), Goal.target_date.asc())
        .limit(5)
    )
    goals = session.exec(statement).all()
    
    # Build dashboard goals with progress
    dashboard_goals = []
    for goal in goals:
        # Get latest progress
        latest_progress = get_latest_progress(goal.id, session)
        current_balance = latest_progress.current_balance if latest_progress else 0.0
        
        # Calculate progress metrics
        progress_pct = calculate_progress_percentage(current_balance, goal.target_amount)
        status_label = calculate_progress_status(goal, current_balance)
        
        dashboard_goals.append(DashboardGoal(
            id=goal.id,
            name=goal.name,
            type=goal.type,
            target_amount=goal.target_amount,
            current_balance=current_balance,
            progress_percentage=progress_pct,
            status_label=status_label,
            target_date=goal.target_date,
            priority=goal.priority
        ))
    
    # Calculate streaks
    current_streak, longest_streak = calculate_streak(current_user.id, session)
    
    # Calculate goal counts
    total_goals_count = session.exec(
        select(func.count(Goal.id)).where(Goal.user_id == current_user.id)
    ).one()
    
    active_goals_count = session.exec(
        select(func.count(Goal.id))
        .where(Goal.user_id == current_user.id)
        .where(Goal.status == GoalStatus.ACTIVE)
    ).one()
    
    completed_goals_count = session.exec(
        select(func.count(Goal.id))
        .where(Goal.user_id == current_user.id)
        .where(Goal.status == GoalStatus.COMPLETED)
    ).one()
    
    # Calculate total saved
    total_saved = get_total_saved_across_goals(current_user.id, session)
    
    # Build stats
    stats = DashboardStats(
        total_goals=total_goals_count,
        active_goals=active_goals_count,
        completed_goals=completed_goals_count,
        total_saved=total_saved,
        current_streak=current_streak,
        longest_streak=longest_streak
    )
    
    # TODO: Implement recent milestones tracking
    # For now, return empty list
    recent_milestones = []
    
    return DashboardResponse(
        goals=dashboard_goals,
        stats=stats,
        recent_milestones=recent_milestones
    )
