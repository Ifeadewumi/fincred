# app/api/v0/routers/health.py
"""
Health check endpoints for monitoring and observability.

Provides endpoints to check application and database health status.
"""
from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.db.session import get_session
from app.db.utils import DatabaseHealthCheck
from app.core.config import settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Basic health check endpoint.
    
    Returns a simple status indicating the application is running.
    Useful for load balancers and container orchestration.
    
    Returns:
        Status message
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV
    }


@router.get("/health/db", status_code=status.HTTP_200_OK)
async def database_health_check(db: Session = Depends(get_session)):
    """
    Database health check endpoint.
    
    Checks database connectivity and response time.
    Returns 200 if healthy, 503 if unhealthy.
    
    Args:
        db: Database session (injected)
        
    Returns:
        Database health status with response time
    """
    health_result = DatabaseHealthCheck.check_connection(db)
    
    # Get additional database info
    db_info = DatabaseHealthCheck.get_database_info(db)
    
    # Combine results
    response = {
        **health_result,
        "database_info": db_info
    }
    
    # Log health check result
    if health_result["status"] == "healthy":
        logger.info(
            f"Database health check: {health_result['status']}",
            extra={"response_time_ms": health_result["response_time_ms"]}
        )
    else:
        logger.error(
            f"Database health check failed: {health_result['message']}",
            extra={"status": health_result["status"]}
        )
    
    # Return 503 if unhealthy
    if health_result["status"] != "healthy":
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response
        )
    
    return response


@router.get("/health/detailed", status_code=status.HTTP_200_OK)
async def detailed_health_check(db: Session = Depends(get_session)):
    """
    Detailed health check endpoint with all service statuses.
    
    Provides comprehensive health information including:
    - Application status
    - Database status and response time
    - Configuration info
    
    Args:
        db: Database session (injected)
        
    Returns:
        Comprehensive health status
    """
    # Check database health
    db_health = DatabaseHealthCheck.check_connection(db)
    db_info = DatabaseHealthCheck.get_database_info(db)
    
    # Determine overall status
    overall_status = "healthy" if db_health["status"] == "healthy" else "degraded"
    
    response = {
        "status": overall_status,
        "service": {
            "name": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENV
        },
        "database": {
            **db_health,
            "info": db_info
        },
        "configuration": {
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_timeout": settings.DB_POOL_TIMEOUT
        }
    }
    
    logger.info(
        f"Detailed health check: {overall_status}",
        extra={"db_status": db_health["status"]}
    )
    
    # Return 503 if any component is unhealthy
    if overall_status != "healthy":
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=response
        )
    
    return response
