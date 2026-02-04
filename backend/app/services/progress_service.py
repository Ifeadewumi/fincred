# backend/app/services/progress_service.py
"""
Progress calculation and tracking service.

This service provides centralized logic for:
- Progress percentage calculations
- Progress status determination (on_track, slightly_behind, off_track)
- Streak tracking from check-ins
- Milestone detection
"""
from datetime import date, datetime, timedelta
from typing import List, Optional, Tuple
from uuid import UUID

from sqlmodel import Session, select, func

from app.models.goal import Goal
from app.models.tracking import GoalProgress, CheckIn
from app.schemas.tracking import ProgressStatus


def calculate_progress_percentage(current: float, target: float) -> float:
    """
    Calculate progress percentage towards a goal.
    
    Args:
        current: Current amount saved/paid
        target: Target amount
        
    Returns:
        Progress as percentage (0-100)
        
    Example:
        >>> calculate_progress_percentage(5000, 10000)
        50.0
    """
    if target <= 0:
        return 0.0
    
    percentage = (current / target) * 100
    return min(percentage, 100.0)  # Cap at 100%


def calculate_progress_status(
    goal: Goal, 
    current_balance: float,
    created_at: Optional[datetime] = None
) -> ProgressStatus:
    """
    Determine progress status based on timeline and amount.
    
    Algorithm:
    - Compare time progress vs amount progress
    - If amount >= time + 10%, status is "on_track"
    - If amount >= time - 10%, status is "slightly_behind"
    - Otherwise, status is "off_track"
    
    Args:
        goal: Goal object with target_date, target_amount, created_at
        current_balance: Current saved/paid amount
        created_at: Optional override for goal creation date
        
    Returns:
        ProgressStatus enum value
    """
    # Handle completed goals
    if current_balance >= goal.target_amount:
        return ProgressStatus.COMPLETED
    
    # Handle not started
    if current_balance == 0:
        return ProgressStatus.NOT_STARTED
    
    # Calculate time progress
    start_date = (created_at or goal.created_at).date()
    today = date.today()
    # Normalize target_date (could be date or datetime from DB)
    raw_target = goal.target_date
    if isinstance(raw_target, datetime):
        target_date = raw_target.date()
    else:
        target_date = raw_target
    
    # Handle past due goals
    if today >= target_date:
        if current_balance >= goal.target_amount:
            return ProgressStatus.COMPLETED
        else:
            return ProgressStatus.OFF_TRACK
    
    total_days = (target_date - start_date).days
    if total_days <= 0:
        return ProgressStatus.OFF_TRACK
    
    days_elapsed = (today - start_date).days
    time_progress = days_elapsed / total_days  # 0.0 to 1.0
    
    # Calculate amount progress
    amount_progress = current_balance / goal.target_amount  # 0.0 to 1.0
    
    # Determine status with 10% buffer
    BUFFER = 0.10
    
    if amount_progress >= time_progress + BUFFER:
        return ProgressStatus.ON_TRACK
    elif amount_progress >= time_progress - BUFFER:
        return ProgressStatus.SLIGHTLY_BEHIND
    else:
        return ProgressStatus.OFF_TRACK


def get_latest_progress(goal_id: UUID, session: Session) -> Optional[GoalProgress]:
    """
    Get the most recent progress record for a goal.
    
    Args:
        goal_id: Goal UUID
        session: Database session
        
    Returns:
        Latest GoalProgress record or None if no progress exists
    """
    statement = (
        select(GoalProgress)
        .where(GoalProgress.goal_id == goal_id)
        .order_by(GoalProgress.recorded_at.desc())
        .limit(1)
    )
    return session.exec(statement).first()


def calculate_streak(user_id: UUID, session: Session) -> Tuple[int, int]:
    """
    Calculate current and longest streak from check-ins.
    
    A streak is consecutive weeks with at least one check-in.
    
    Args:
        user_id: User UUID
        session: Database session
        
    Returns:
        Tuple of (current_streak, longest_streak) in weeks
    """
    # Get all check-ins ordered by date (newest first)
    statement = (
        select(CheckIn)
        .where(CheckIn.user_id == user_id)
        .order_by(CheckIn.completed_at.desc())
    )
    check_ins = session.exec(statement).all()
    
    if not check_ins:
        return (0, 0)
    
    # Group check-ins by week
    weeks_with_checkins = set()
    for checkin in check_ins:
        # Get the week start date (Monday)
        week_start = checkin.completed_at.date() - timedelta(days=checkin.completed_at.weekday())
        weeks_with_checkins.add(week_start)
    
    if not weeks_with_checkins:
        return (0, 0)
    
    # Sort weeks
    sorted_weeks = sorted(weeks_with_checkins, reverse=True)
    
    # Calculate current streak
    current_streak = 0
    today = date.today()
    current_week_start = today - timedelta(days=today.weekday())
    expected_week = current_week_start
    
    for week in sorted_weeks:
        if week == expected_week:
            current_streak += 1
            expected_week = expected_week - timedelta(weeks=1)
        else:
            break
    
    # Calculate longest streak
    longest_streak = 0
    temp_streak = 1
    
    for i in range(len(sorted_weeks) - 1):
        current_week = sorted_weeks[i]
        next_week = sorted_weeks[i + 1]
        
        # Check if weeks are consecutive
        if current_week - timedelta(weeks=1) == next_week:
            temp_streak += 1
            longest_streak = max(longest_streak, temp_streak)
        else:
            temp_streak = 1
    
    longest_streak = max(longest_streak, temp_streak, current_streak)
    
    return (current_streak, longest_streak)


def detect_milestones_reached(
    goal_id: UUID,
    new_balance: float,
    old_balance: float,
    target_amount: float
) -> List[str]:
    """
    Detect newly achieved milestones based on progress update.
    
    Milestones: 25%, 50%, 75%, 100%
    
    Args:
        goal_id: Goal UUID
        new_balance: New balance after update
        old_balance: Previous balance
        target_amount: Goal target amount
        
    Returns:
        List of milestone descriptions (e.g., ["25%", "50%"])
    """
    milestones = []
    milestone_percentages = [25, 50, 75, 100]
    
    old_percentage = (old_balance / target_amount) * 100
    new_percentage = (new_balance / target_amount) * 100
    
    for milestone in milestone_percentages:
        # Check if we crossed this milestone
        if old_percentage < milestone <= new_percentage:
            milestones.append(f"{milestone}%")
    
    return milestones


def get_total_saved_across_goals(user_id: UUID, session: Session) -> float:
    """
    Calculate total amount saved across all user's goals.
    
    Args:
        user_id: User UUID
        session: Database session
        
    Returns:
        Total amount saved/paid across all goals
    """
    # Get all active goals for user
    goals = session.exec(
        select(Goal)
        .where(Goal.user_id == user_id)
        .where(Goal.status == "active")
    ).all()
    
    total = 0.0
    for goal in goals:
        latest_progress = get_latest_progress(goal.id, session)
        if latest_progress:
            total += latest_progress.current_balance
    
    return total
