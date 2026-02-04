from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.goal import Goal
from app.models.tracking import GoalProgress, CheckIn
from app.models.user import User
from app.schemas.tracking import (
    GoalProgressCreate,
    GoalProgressRead,
    GoalProgressUpdate,
    CheckInCreate,
    CheckInRead,
    CheckInUpdate,
)


# --- GoalProgress Service Functions ---
def get_progress_records_for_goal(
    db: Session, user: User, goal_id: UUID, limit: int = 20, offset: int = 0
) -> List[GoalProgressRead]:
    """Retrieves progress records for a specific goal belonging to the user."""
    goal = db.get(Goal, goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    statement = (
        select(GoalProgress)
        .where(GoalProgress.user_id == user.id)
        .where(GoalProgress.goal_id == goal_id)
        .order_by(GoalProgress.recorded_at.desc())
        .limit(limit)
        .offset(offset)
    )
    progress_records = db.exec(statement).all()
    return [GoalProgressRead.model_validate(gp) for gp in progress_records]


def create_goal_progress_record(
    db: Session, user: User, progress_in: GoalProgressCreate
) -> GoalProgressRead:
    """Creates a new progress record for a user's goal."""
    goal = db.get(Goal, progress_in.goal_id)
    if not goal or goal.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    try:
        progress_record = GoalProgress(user_id=user.id, **progress_in.dict())
        db.add(progress_record)
        db.commit()
        db.refresh(progress_record)
        return GoalProgressRead.model_validate(progress_record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the goal progress record: {e}",
        )


def get_goal_progress_record_by_id(
    db: Session, user: User, progress_id: UUID
) -> GoalProgressRead:
    """Retrieves a single goal progress record by its ID for a given user."""
    progress_record = db.get(GoalProgress, progress_id)
    if not progress_record or progress_record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal Progress record not found")
    return GoalProgressRead.model_validate(progress_record)


def update_goal_progress_record(
    db: Session, user: User, progress_id: UUID, progress_in: GoalProgressUpdate
) -> GoalProgressRead:
    """Updates an existing goal progress record for a user."""
    progress_record = db.get(GoalProgress, progress_id)
    if not progress_record or progress_record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal Progress record not found")

    update_data = progress_in.dict(exclude_unset=True)

    try:
        for field, value in update_data.items():
            setattr(progress_record, field, value)
        db.add(progress_record)
        db.commit()
        db.refresh(progress_record)
        return GoalProgressRead.model_validate(progress_record)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the goal progress record: {e}",
        )


def delete_goal_progress_record(db: Session, user: User, progress_id: UUID) -> None:
    """Deletes a goal progress record for a user."""
    progress_record = db.get(GoalProgress, progress_id)
    if not progress_record or progress_record.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal Progress record not found")

    try:
        db.delete(progress_record)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting the goal progress record: {e}",
        )


# --- CheckIn Service Functions ---
def get_check_ins_for_user(
    db: Session, user: User, limit: int = 20, offset: int = 0
) -> List[CheckInRead]:
    """Retrieves a list of check-ins for a given user."""
    statement = (
        select(CheckIn)
        .where(CheckIn.user_id == user.id)
        .order_by(CheckIn.completed_at.desc())
        .limit(limit)
        .offset(offset)
    )
    check_ins = db.exec(statement).all()
    return [CheckInRead.model_validate(ci) for ci in check_ins]


def create_new_check_in(db: Session, user: User, check_in_in: CheckInCreate) -> CheckInRead:
    """Creates a new check-in record for a user."""
    try:
        check_in = CheckIn(user_id=user.id, **check_in_in.dict())
        db.add(check_in)
        db.commit()
        db.refresh(check_in)
        return CheckInRead.model_validate(check_in)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the check-in: {e}",
        )


def get_check_in_by_id(db: Session, user: User, check_in_id: UUID) -> CheckInRead:
    """Retrieves a single check-in record by its ID for a given user."""
    check_in = db.get(CheckIn, check_in_id)
    if not check_in or check_in.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in record not found")
    return CheckInRead.model_validate(check_in)


def update_existing_check_in(
    db: Session, user: User, check_in_id: UUID, check_in_in: CheckInUpdate
) -> CheckInRead:
    """Updates an existing check-in record for a user."""
    check_in = db.get(CheckIn, check_in_id)
    if not check_in or check_in.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in record not found")

    update_data = check_in_in.dict(exclude_unset=True)

    try:
        for field, value in update_data.items():
            setattr(check_in, field, value)
        db.add(check_in)
        db.commit()
        db.refresh(check_in)
        return CheckInRead.model_validate(check_in)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the check-in: {e}",
        )


def delete_user_check_in(db: Session, user: User, check_in_id: UUID) -> None:
    """Deletes a check-in record for a user."""
    check_in = db.get(CheckIn, check_in_id)
    if not check_in or check_in.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Check-in record not found")

    try:
        db.delete(check_in)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting the check-in: {e}",
        )

