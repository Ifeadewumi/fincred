# app/services/snapshot_service.py
from fastapi import HTTPException, status
from sqlmodel import Session, select, delete

from app.models.user import User
from app.models.snapshot import Income, ExpenseEstimate, Debt, SavingsAccount
from app.schemas.snapshot import (
    SnapshotPutRequest,
    SnapshotResponse,
    IncomeOut,
    ExpenseEstimateOut,
    DebtOut,
    SavingsOut,
)


def get_snapshot_for_user(db: Session, user: User) -> SnapshotResponse:
    """
    Retrieves all financial snapshot components for a given user from the database.
    """
    income = db.exec(
        select(Income).where(Income.user_id == user.id).order_by(Income.created_at.desc())
    ).first()
    expenses = db.exec(
        select(ExpenseEstimate)
        .where(ExpenseEstimate.user_id == user.id)
        .order_by(ExpenseEstimate.created_at.desc())
    ).first()
    debts = db.exec(select(Debt).where(Debt.user_id == user.id)).all()
    savings = db.exec(select(SavingsAccount).where(SavingsAccount.user_id == user.id)).all()

    return SnapshotResponse(
        income=IncomeOut.from_orm(income) if income else None,
        expenses=ExpenseEstimateOut.from_orm(expenses) if expenses else None,
        debts=[DebtOut.from_orm(d) for d in debts],
        savings=[SavingsOut.from_orm(s) for s in savings],
    )


def create_or_update_snapshot(
    db: Session, user: User, snapshot_in: SnapshotPutRequest
) -> SnapshotResponse:
    """
    Creates or replaces a user's financial snapshot in a single atomic transaction.

    This implementation uses a "delete-all-then-re-add" approach within the
    transaction for simplicity and to ensure idempotency for the PUT method.
    """
    try:
        # --- Start Transaction ---
        
        # 1. Clear existing snapshot data for this user
        for model in [Income, ExpenseEstimate, Debt, SavingsAccount]:
            statement = delete(model).where(model.user_id == user.id)
            db.exec(statement)

        # 2. Create new records from the input schema
        if snapshot_in.income:
            income = Income(user_id=user.id, **snapshot_in.income.dict())
            db.add(income)

        if snapshot_in.expenses:
            expenses = ExpenseEstimate(user_id=user.id, **snapshot_in.expenses.dict())
            db.add(expenses)

        for d_in in snapshot_in.debts:
            debt = Debt(user_id=user.id, **d_in.dict())
            db.add(debt)

        for s_in in snapshot_in.savings:
            sa = SavingsAccount(user_id=user.id, **s_in.dict())
            db.add(sa)

        # 3. Commit the transaction
        db.commit()

    except Exception:
        # If any step fails, roll back all changes to maintain data integrity
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the financial snapshot.",
        )

    # 4. After a successful commit, return the newly created state
    # Calling get_snapshot_for_user ensures the response reflects the committed state
    return get_snapshot_for_user(db=db, user=user)

