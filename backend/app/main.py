# app/main.py
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v0.deps import get_current_user
from app.api.v0.routers import (
    auth,
    goals,
    planning,
    snapshot,
    users,
    action_plan,
    checkin,
    dashboard,
    notification,
    education,
)
from app.core.config import settings
from app.core.middleware import setup_middleware
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan context manager for FastAPI application.
    
    Replaces deprecated @app.on_event decorators with modern pattern.
    Handles startup and shutdown logic with proper error handling.
    """
    # Startup logic
    try:
        print(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
        print(f"📊 Environment: {settings.ENV}")
        print(f"🔒 CORS Origins: {settings.CORS_ORIGINS}")
        
        # Initialize database schema (for dev only; use Alembic in production)
        if settings.ENV == "development":
            print("🗄️  Initializing database schema (development mode)...")
            init_db()
            print("✅ Database schema initialized")
        else:
            print("⚠️  Skipping auto schema creation (use Alembic migrations)")
        
        print(f"✅ {settings.PROJECT_NAME} started successfully")
        
    except Exception as e:
        print(f"❌ Failed to start application: {e}")
        raise
    
    # Application is running
    yield
    
    # Shutdown logic
    print(f"🛑 Shutting down {settings.PROJECT_NAME}...")
    # Add any cleanup logic here (close connections, flush logs, etc.)
    print("✅ Shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="AI-powered financial coaching platform helping users achieve their financial goals through personalized planning and behavioral nudges.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V0_PREFIX}/openapi.json",
    )
    
    # --- CORS Middleware ---
    # Must be added before other middleware to work properly
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=settings.CORS_ALLOW_METHODS,
        allow_headers=settings.CORS_ALLOW_HEADERS,
    )
    
    # --- Custom Middleware ---
    # Adds request ID, timing, and security headers
    setup_middleware(
        app,
        enable_hsts=(settings.ENV == "production")  # Only enable HSTS in production
    )
    
    # --- API Routers ---
    
    # Public routers (no authentication required)
    app.include_router(auth.router, prefix=settings.API_V0_PREFIX, tags=["Authentication"])
    app.include_router(education.router, prefix=settings.API_V0_PREFIX, tags=["Education"])
    
    # Protected routers (authentication required)
    # The get_current_user dependency enables the "Authorize" button in Swagger UI
    app.include_router(
        users.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Users"],
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        snapshot.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Financial Snapshot"],
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        goals.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Goals"],
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        planning.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Planning"],
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        action_plan.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Action Plans"],
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        checkin.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Check-ins"],
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        dashboard.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Dashboard"],
        dependencies=[Depends(get_current_user)],
    )
    app.include_router(
        notification.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Notifications"],
        dependencies=[Depends(get_current_user)],
    )
    
    return app


app = create_app()

