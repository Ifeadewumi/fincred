# app/api/v0/routers/snapshot.py
from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.api.v0.deps import get_current_user, get_db
from app.schemas.snapshot import SnapshotPutRequest, SnapshotResponse
from app.services import snapshot_service

router = APIRouter(prefix="/snapshot", tags=["snapshot"])


@router.get("", response_model=SnapshotResponse)
def get_snapshot(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the user's complete financial snapshot.
    """
    return snapshot_service.get_snapshot_for_user(db=db, user=current_user)


@router.put("", response_model=SnapshotResponse)
def put_snapshot(
    snapshot_in: SnapshotPutRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Creates or replaces the user's financial snapshot using an atomic operation.
    """
    return snapshot_service.create_or_update_snapshot(
        db=db, user=current_user, snapshot_in=snapshot_in
    )
