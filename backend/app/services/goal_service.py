# backend/app/services/goal_service.py
from datetime import date
from typing import List
from uuid import UUID

from sqlmodel import Session, select
from sqlalchemy import func

from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate, GoalStatus
from app.core.exceptions import (
    ResourceNotFoundError,
    InvalidGoalDateError,
    GoalLimitExceededError,
    DatabaseError,
    NoFieldsToUpdateError
)
from app.core.logging_config import get_logger

logger = get_logger(__name__)


def get_all_goals(
    db: Session, user: User, limit: int = 20, offset: int = 0
) -> List[GoalRead]:
    """
    Retrieves a list of goals for a given user.
    
    Args:
        db: Database session
        user: Current user
        limit: Maximum number of goals to return
        offset: Number of goals to skip
        
    Returns:
        List of user's goals
    """
    try:
        statement = (
            select(Goal)
            .where(Goal.user_id == user.id)
            .order_by(Goal.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        goals = db.exec(statement).all()
        
        logger.info(
            f"Retrieved {len(goals)} goals for user",
            extra={"user_id": str(user.id), "count": len(goals)}
        )
        
        return [GoalRead.model_validate(g) for g in goals]
        
    except Exception as e:
        logger.error(
            f"Failed to retrieve goals for user",
            extra={"user_id": str(user.id)},
            exc_info=True
        )
        raise DatabaseError("Failed to retrieve goals", original_error=e)


def create_new_goal(db: Session, user: User, goal_in: GoalCreate) -> GoalRead:
    """
    Creates a new goal for a user with validation.
    
    Args:
        db: Database session
        user: Current user
        goal_in: Goal creation data
        
    Returns:
        Created goal
        
    Raises:
        InvalidGoalDateError: If target date is not in the future
        GoalLimitExceededError: If user has too many active goals
        DatabaseError: If database operation fails
    """
    # Validate target date is in the future
    if goal_in.target_date <= date.today():
        logger.warning(
            f"Invalid goal target date",
            extra={"user_id": str(user.id), "target_date": str(goal_in.target_date)}
        )
        raise InvalidGoalDateError("Target date must be in the future")

    # Check active goal count limit
    try:
        active_count_statement = (
            select(func.count(Goal.id))
            .where(Goal.user_id == user.id)
            .where(Goal.status == GoalStatus.ACTIVE)
        )
        active_count = db.exec(active_count_statement).one()

        if active_count >= 5:
            logger.warning(
                f"Goal limit exceeded for user",
                extra={"user_id": str(user.id), "active_count": active_count}
            )
            raise GoalLimitExceededError(current_count=active_count, max_count=5)

        # Create the goal
        goal = Goal(
            user_id=user.id,
            type=goal_in.type,
            name=goal_in.name,
            target_amount=goal_in.target_amount,
            target_date=goal_in.target_date,
            priority=goal_in.priority,
            primary_flag=goal_in.primary_flag,
            why_text=goal_in.why_text,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        
        logger.info(
            f"Created new goal",
            extra={
                "user_id": str(user.id),
                "goal_id": str(goal.id),
                "goal_type": goal.type,
                "goal_name": goal.name
            }
        )
        
        return GoalRead.model_validate(goal)
        
    except (InvalidGoalDateError, GoalLimitExceededError):
        # Re-raise our custom exceptions without wrapping
        raise
    except Exception as e:
        db.rollback()
        logger.error(
            f"Failed to create goal",
            extra={"user_id": str(user.id)},
            exc_info=True
        )
        raise DatabaseError("Failed to create goal", original_error=e)


def get_goal_by_id(db: Session, user: User, goal_id: UUID) -> GoalRead:
    """
    Retrieves a single goal by its ID for a given user.
    
    Args:
        db: Database session
        user: Current user
        goal_id: Goal UUID
        
    Returns:
        Goal details
        
    Raises:
        ResourceNotFoundError: If goal not found or doesn't belong to user
    """
    goal = db.get(Goal, goal_id)
    
    if not goal or goal.user_id != user.id:
        logger.warning(
            f"Goal not found or access denied",
            extra={"user_id": str(user.id), "goal_id": str(goal_id)}
        )
        raise ResourceNotFoundError("Goal", str(goal_id))
    
    return GoalRead.model_validate(goal)


def update_existing_goal(
    db: Session, user: User, goal_id: UUID, goal_in: GoalUpdate
) -> GoalRead:
    """
    Updates an existing goal for a user with validation.
    
    Args:
        db: Database session
        user: Current user
        goal_id: Goal UUID
        goal_in: Goal update data
        
    Returns:
        Updated goal
        
    Raises:
        ResourceNotFoundError: If goal not found
        InvalidGoalDateError: If new target date is invalid
        NoFieldsToUpdateError: If no fields provided
        DatabaseError: If database operation fails
    """
    goal = db.get(Goal, goal_id)
    
    if not goal or goal.user_id != user.id:
        logger.warning(
            f"Goal not found for update",
            extra={"user_id": str(user.id), "goal_id": str(goal_id)}
        )
        raise ResourceNotFoundError("Goal", str(goal_id))

    update_data = goal_in.model_dump(exclude_unset=True)
    
    if not update_data:
        raise NoFieldsToUpdateError()

    # Validate target date if being updated
    if "target_date" in update_data and update_data["target_date"] <= date.today():
        logger.warning(
            f"Invalid goal target date in update",
            extra={
                "user_id": str(user.id),
                "goal_id": str(goal_id),
                "target_date": str(update_data["target_date"])
            }
        )
        raise InvalidGoalDateError("Target date must be in the future")

    try:
        # Apply updates
        for field, value in update_data.items():
            setattr(goal, field, value)
        
        db.add(goal)
        db.commit()
        db.refresh(goal)
        
        logger.info(
            f"Updated goal",
            extra={
                "user_id": str(user.id),
                "goal_id": str(goal_id),
                "updated_fields": list(update_data.keys())
            }
        )
        
        return GoalRead.model_validate(goal)
        
    except (InvalidGoalDateError, NoFieldsToUpdateError):
        raise
    except Exception as e:
        db.rollback()
        logger.error(
            f"Failed to update goal",
            extra={"user_id": str(user.id), "goal_id": str(goal_id)},
            exc_info=True
        )
        raise DatabaseError("Failed to update goal", original_error=e)


def delete_user_goal(db: Session, user: User, goal_id: UUID) -> None:
    """
    Soft deletes (cancels) a goal for a user.
    
    Args:
        db: Database session
        user: Current user
        goal_id: Goal UUID
        
    Raises:
        ResourceNotFoundError: If goal not found
        DatabaseError: If database operation fails
    """
    goal = db.get(Goal, goal_id)
    
    if not goal or goal.user_id != user.id:
        logger.warning(
            f"Goal not found for deletion",
            extra={"user_id": str(user.id), "goal_id": str(goal_id)}
        )
        raise ResourceNotFoundError("Goal", str(goal_id))

    try:
        # Soft delete: mark as cancelled instead of removing the row
        goal.status = GoalStatus.CANCELLED
        db.add(goal)
        db.commit()
        
        logger.info(
            f"Soft deleted goal",
            extra={"user_id": str(user.id), "goal_id": str(goal_id)}
        )
        
    except Exception as e:
        db.rollback()
        logger.error(
            f"Failed to delete goal",
            extra={"user_id": str(user.id), "goal_id": str(goal_id)},
            exc_info=True
        )
        raise DatabaseError("Failed to delete goal", original_error=e)

