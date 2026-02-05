# backend/app/api/v0/routers/checkin.py
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.api.v0.deps import get_current_user
from app.models.user import User
from app.schemas.tracking import CheckInCreate, CheckInRead, CheckInUpdate
from app.services import tracking_service
from app.db.session import get_session

router = APIRouter(prefix="/checkins")


@router.get("", response_model=List[CheckInRead])
def list_my_check_ins(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Retrieves a list of all check-ins for the current user.
    """
    return tracking_service.get_check_ins_for_user(
        db=db, user=current_user, limit=limit, offset=offset
    )


@router.post("", response_model=CheckInRead, status_code=status.HTTP_201_CREATED)
def create_check_in(
    check_in_in: CheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Creates a new check-in record for the current user.
    """
    return tracking_service.create_new_check_in(
        db=db, user=current_user, check_in_in=check_in_in
    )


@router.get("/{check_in_id}", response_model=CheckInRead)
def get_check_in(
    check_in_id: UUID, # CHANGED
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Retrieves a single check-in record by ID for the current user.
    """
    return tracking_service.get_check_in_by_id(
        db=db, user=current_user, check_in_id=check_in_id
    )


@router.put("/{check_in_id}", response_model=CheckInRead)
def update_check_in(
    check_in_id: UUID, # CHANGED
    check_in_in: CheckInUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Updates an existing check-in record for the current user.
    """
    return tracking_service.update_existing_check_in(
        db=db, user=current_user, check_in_id=check_in_id, check_in_in=check_in_in
    )


@router.delete("/{check_in_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_check_in(
    check_in_id: UUID, # CHANGED
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_session),
):
    """
    Deletes a check-in record for the current user.
    """
    tracking_service.delete_user_check_in(
        db=db, user=current_user, check_in_id=check_in_id
    )
    return None