# app/main.py
from fastapi import FastAPI

from app.core.config import settings
from app.db.session import init_db
from app.api.v0.routers import auth, users


def create_app() -> FastAPI:
    app = FastAPI(title=settings.PROJECT_NAME)

    # Initialize DB schema (for dev only; use Alembic in real env)
    @app.on_event("startup")
    def on_startup():
        init_db()

    # Versioned API: v0
    app.include_router(auth.router, prefix="/api/v0")
    app.include_router(users.router, prefix="/api/v0")

    return app


app = create_app()
