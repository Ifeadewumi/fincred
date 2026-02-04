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
    health,
    goal_progress,
)
from app.core.config import settings
from app.core.middleware import setup_middleware
from app.core.exception_handlers import register_exception_handlers
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan context manager for FastAPI application.
    
    Replaces deprecated @app.on_event decorators with modern pattern.
    Handles startup and shutdown logic with proper error handling.
    """
    # Import logging after setup
    from app.core.logging_config import get_logger
    logger = get_logger(__name__)
    
    # Startup logic
    try:
        logger.info(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
        logger.info(f"📊 Environment: {settings.ENV}")
        logger.info(f"🔒 CORS Origins: {settings.CORS_ORIGINS}")
        
        # Initialize database schema (for dev only; use Alembic in production)
        if settings.ENV == "development":
            logger.info("🗄️  Initializing database schema (development mode)...")
            init_db()
            logger.info("✅ Database schema initialized")
        else:
            logger.warning("⚠️  Skipping auto schema creation (use Alembic migrations)")
        
        logger.info(f"✅ {settings.PROJECT_NAME} started successfully")
        
    except Exception as e:
        logger.critical(f"❌ Failed to start application: {e}", exc_info=True)
        raise
    
    # Application is running
    yield
    
    # Shutdown logic
    logger.info(f"🛑 Shutting down {settings.PROJECT_NAME}...")
    # Add any cleanup logic here (close connections, flush logs, etc.)
    logger.info("✅ Shutdown complete")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        Configured FastAPI application instance
    """
    app = FastAPI(
        lifespan=lifespan,
        title="FinCred API",
        description="""
## Financial Goal Setting and Tracking Platform

FinCred helps users set, track, and achieve their financial goals through:

* **Goal Management**: Create and track multiple financial goals
* **Action Plans**: Get personalized steps to reach your goals
* **Progress Tracking**: Monitor your progress with check-ins
* **Smart Nudges**: Receive timely reminders and encouragement
* **Financial Education**: Access curated educational content

### Authentication

All endpoints (except /auth/*) require a Bearer token obtained via login.

Send the token in the `Authorization` header:
```
Authorization: Bearer <your_token_here>
```
        """,
        version=settings.VERSION,
        contact={
            "name": "FinCred Support",
            "email": "support@fincred.com",
            "url": "https://fincred.com/support"
        },
        license_info={
            "name": "MIT License",
            "url": "https://opensource.org/licenses/MIT"
        },
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V0_PREFIX}/openapi.json",
        openapi_tags=[
            {
                "name": "authentication",
                "description": "User authentication and authorization operations"
            },
            {
                "name": "users",
                "description": "User profile management"
            },
            {
                "name": "goals",
                "description": "Financial goal creation and management"
            },
            {
                "name": "planning",
                "description": "Financial planning and recommendations"
            },
            {
                "name": "tracking",
                "description": "Progress tracking and check-ins"
            },
            {
                "name": "notifications",
                "description": "Nudges and notification management"
            },
            {
                "name": "education",
                "description": "Educational content and resources"
            },
            {
                "name": "goal-progress",
                "description": "Goal progress tracking and history"
            },
            {
                "name": "health",
                "description": "System health and monitoring"
            }
        ]
    )
    
    # Store settings in app state for access in exception handlers
    app.state.settings = settings
    
    # Register global exception handlers
    register_exception_handlers(app)
    
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
    app.include_router(health.router, prefix=settings.API_V0_PREFIX, tags=["Health"])
    
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
        goal_progress.router,
        prefix=settings.API_V0_PREFIX,
        tags=["Goal Progress"],
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

