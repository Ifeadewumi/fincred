# backend/app/services/notification_service.py
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.notification import NudgeSchedule
from app.models.user import User
from app.schemas.notification import NudgeScheduleCreate, NudgeScheduleRead, NudgeScheduleUpdate


def get_nudge_schedules_for_user(
    db: Session, user: User, limit: int = 20, offset: int = 0
) -> List[NudgeScheduleRead]:
    """Retrieves a list of nudge schedules for a given user."""
    statement = (
        select(NudgeSchedule)
        .where(NudgeSchedule.user_id == user.id)
        .order_by(NudgeSchedule.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    nudge_schedules = db.exec(statement).all()
    return [NudgeScheduleRead.model_validate(ns) for ns in nudge_schedules]


def create_new_nudge_schedule(
    db: Session, user: User, nudge_schedule_in: NudgeScheduleCreate
) -> NudgeScheduleRead:
    """Creates a new nudge schedule for a user."""
    # Basic validation for action_plan_id if provided
    if nudge_schedule_in.action_plan_id:
        from app.models.action_plan import ActionPlan # Import here to avoid circular dependency
        action_plan = db.get(ActionPlan, nudge_schedule_in.action_plan_id)
        if not action_plan or action_plan.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action Plan not found or does not belong to user")

    try:
        nudge_schedule = NudgeSchedule(user_id=user.id, **nudge_schedule_in.dict())
        db.add(nudge_schedule)
        db.commit()
        db.refresh(nudge_schedule)
        return NudgeScheduleRead.model_validate(nudge_schedule)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while creating the nudge schedule: {e}",
        )


def get_nudge_schedule_by_id(
    db: Session, user: User, nudge_schedule_id: UUID
) -> NudgeScheduleRead:
    """Retrieves a single nudge schedule by its ID for a given user."""
    nudge_schedule = db.get(NudgeSchedule, nudge_schedule_id)
    if not nudge_schedule or nudge_schedule.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nudge Schedule not found")
    return NudgeScheduleRead.model_validate(nudge_schedule)


def update_existing_nudge_schedule(
    db: Session, user: User, nudge_schedule_id: UUID, nudge_schedule_in: NudgeScheduleUpdate
) -> NudgeScheduleRead:
    """Updates an existing nudge schedule for a user."""
    nudge_schedule = db.get(NudgeSchedule, nudge_schedule_id)
    if not nudge_schedule or nudge_schedule.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nudge Schedule not found")

    update_data = nudge_schedule_in.dict(exclude_unset=True)

    try:
        for field, value in update_data.items():
            setattr(nudge_schedule, field, value)
        db.add(nudge_schedule)
        db.commit()
        db.refresh(nudge_schedule)
        return NudgeScheduleRead.model_validate(nudge_schedule)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while updating the nudge schedule: {e}",
        )


def delete_user_nudge_schedule(db: Session, user: User, nudge_schedule_id: UUID) -> None:
    """Deletes a nudge schedule for a user."""
    nudge_schedule = db.get(NudgeSchedule, nudge_schedule_id)
    if not nudge_schedule or nudge_schedule.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nudge Schedule not found")

    try:
        db.delete(nudge_schedule)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while deleting the nudge schedule: {e}",
        )
