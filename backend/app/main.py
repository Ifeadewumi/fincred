# app/main.py
from fastapi import Depends, FastAPI

from app.api.v0.deps import get_current_user
from app.api.v0.routers import auth, goals, planning, snapshot, users, action_plan, checkin, dashboard, notification, education # ADD education
from app.core.config import settings
from app.db.session import init_db


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)

    # Initialize DB schema (for dev only; use Alembic in real env)
    @app.on_event("startup")
    def on_startup():
        init_db()

    # --- API Routers ---

    # Public router for authentication and education snippets
    app.include_router(auth.router, prefix="/api/v0")
    app.include_router(education.router, prefix="/api/v0") # ADD education router as public

    # Protected routers that require authentication
    # Adding the `get_current_user` dependency here enables the
    # "Authorize" button in Swagger UI for all routes in these routers.
    app.include_router(
        users.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        snapshot.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        goals.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        planning.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        action_plan.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        checkin.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        dashboard.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        notification.router,
        prefix="/api/v0",
        dependencies=[Depends(get_current_user)],
    )

    return app


app = create_app()
