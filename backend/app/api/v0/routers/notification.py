# backend/app/api/v0/routers/notification.py
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.v0.deps import get_current_user
from app.models.user import User
from app.schemas.notification import NudgeScheduleCreate, NudgeScheduleRead, NudgeScheduleUpdate
from app.services import notification_service
from app.db.session import get_session

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NudgeScheduleRead])
def list_my_nudge_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Retrieves a list of all nudge schedules for the current user.
    """
    return notification_service.get_nudge_schedules_for_user(
        db=db, user=current_user, limit=limit, offset=offset
    )


@router.post("", response_model=NudgeScheduleRead, status_code=status.HTTP_201_CREATED)
def create_nudge_schedule(
    nudge_schedule_in: NudgeScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Creates a new nudge schedule for the current user.
    (Note: Most creation will happen server-side by the planning/action logic).
    """
    return notification_service.create_new_nudge_schedule(
        db=db, user=current_user, nudge_schedule_in=nudge_schedule_in
    )


@router.get("/{nudge_schedule_id}", response_model=NudgeScheduleRead)
def get_nudge_schedule(
    nudge_schedule_id: UUID, # CHANGED
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Retrieves a single nudge schedule by ID for the current user.
    """
    return notification_service.get_nudge_schedule_by_id(
        db=db, user=current_user, nudge_schedule_id=nudge_schedule_id
    )


@router.put("/{nudge_schedule_id}", response_model=NudgeScheduleRead)
def update_nudge_schedule(
    nudge_schedule_id: UUID, # CHANGED
    nudge_schedule_in: NudgeScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Updates an existing nudge schedule for the current user.
    """
    return notification_service.update_existing_nudge_schedule(
        db=db, user=current_user, nudge_schedule_id=nudge_schedule_id, nudge_schedule_in=nudge_schedule_in
    )


@router.delete("/{nudge_schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_nudge_schedule(
    nudge_schedule_id: UUID, # CHANGED
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Deletes a nudge schedule for the current user.
    """
    notification_service.delete_user_nudge_schedule(
        db=db, user=current_user, nudge_schedule_id=nudge_schedule_id
    )
    return None
