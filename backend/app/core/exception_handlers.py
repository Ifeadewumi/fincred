# app/core/exception_handlers.py
"""
Global exception handlers for the FastAPI application.

Provides consistent error responses and logging for all exceptions,
including custom exceptions, FastAPI validation errors, and unexpected errors.
"""
import logging
from typing import Union
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError as PydanticValidationError

from app.core.exceptions import FinCredException, ErrorCode
from app.core.logging_config import get_logger

logger = get_logger(__name__)


async def fincred_exception_handler(request: Request, exc: FinCredException) -> JSONResponse:
    """
    Handle custom FinCred exceptions.
    
    Logs the exception and returns a structured error response.
    
    Args:
        request: The FastAPI request object
        exc: The FinCred exception
    
    Returns:
        JSON response with error details
    """
    # Get request ID for correlation
    request_id = getattr(request.state, 'request_id', None)
    
    # Log the exception with context
    log_extra = {
        'request_id': request_id,
        'path': request.url.path,
        'method': request.method,
        'error_code': exc.error_code.value,
        'status_code': exc.status_code,
    }
    
    if exc.details:
        log_extra['error_details'] = exc.details
    
    # Log at appropriate level based on status code
    if exc.status_code >= 500:
        logger.error(f"Server error: {exc.message}", extra=log_extra, exc_info=True)
    elif exc.status_code >= 400:
        logger.warning(f"Client error: {exc.message}", extra=log_extra)
    
    # Build response
    response_data = exc.to_dict()
    
    # Add request ID to response for client correlation
    if request_id:
        response_data['request_id'] = request_id
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data
    )


async def validation_exception_handler(
    request: Request,
    exc: Union[RequestValidationError, PydanticValidationError]
) -> JSONResponse:
    """
    Handle FastAPI/Pydantic validation errors.
    
    Converts validation errors into a structured response format
    consistent with custom exception responses.
    
    Args:
        request: The FastAPI request object
        exc: The validation exception
    
    Returns:
        JSON response with validation error details
    """
    # Get request ID for correlation
    request_id = getattr(request.state, 'request_id', None)
    
    # Extract validation errors
    errors = []
    for error in exc.errors():
        field_path = " -> ".join(str(loc) for loc in error['loc'])
        errors.append({
            'field': field_path,
            'message': error['msg'],
            'type': error['type']
        })
    
    # Log validation error
    logger.warning(
        f"Validation error on {request.method} {request.url.path}",
        extra={
            'request_id': request_id,
            'path': request.url.path,
            'method': request.method,
            'validation_errors': errors
        }
    )
    
    # Build response
    response_data = {
        'error_code': ErrorCode.VALIDATION_ERROR.value,
        'message': 'Request validation failed',
        'details': {
            'errors': errors
        }
    }
    
    if request_id:
        response_data['request_id'] = request_id
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=response_data
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handle Starlette HTTP exceptions.
    
    Provides consistent error responses for standard HTTP exceptions
    raised by FastAPI/Starlette.
    
    Args:
        request: The FastAPI request object
        exc: The HTTP exception
    
    Returns:
        JSON response with error details
    """
    # Get request ID for correlation
    request_id = getattr(request.state, 'request_id', None)
    
    # Log the exception
    logger.warning(
        f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
        extra={
            'request_id': request_id,
            'path': request.url.path,
            'method': request.method,
            'status_code': exc.status_code
        }
    )
    
    # Build response
    response_data = {
        'error_code': 'HTTP_ERROR',
        'message': exc.detail
    }
    
    if request_id:
        response_data['request_id'] = request_id
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response_data
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions that weren't caught elsewhere.
    
    This is the last line of defense to ensure no exceptions escape
    without being logged and returning a proper response.
    
    Args:
        request: The FastAPI request object
        exc: The unhandled exception
    
    Returns:
        JSON response with generic error message
    """
    # Get request ID for correlation
    request_id = getattr(request.state, 'request_id', None)
    
    # Log the unexpected exception with full traceback
    logger.critical(
        f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}",
        extra={
            'request_id': request_id,
            'path': request.url.path,
            'method': request.method,
            'exception_type': type(exc).__name__
        },
        exc_info=True  # Include full traceback
    )
    
    # Build generic error response (don't expose internal details)
    response_data = {
        'error_code': ErrorCode.INTERNAL_SERVER_ERROR.value,
        'message': 'An unexpected error occurred. Please try again later.'
    }
    
    if request_id:
        response_data['request_id'] = request_id
    
    # Include exception details only in development
    if hasattr(request.app.state, 'settings'):
        settings = request.app.state.settings
        if settings.ENV == 'development':
            response_data['details'] = {
                'exception_type': type(exc).__name__,
                'exception_message': str(exc)
            }
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response_data
    )


def register_exception_handlers(app) -> None:
    """
    Register all exception handlers with the FastAPI application.
    
    Args:
        app: The FastAPI application instance
    """
    # Custom FinCred exceptions
    app.add_exception_handler(FinCredException, fincred_exception_handler)
    
    # Validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(PydanticValidationError, validation_exception_handler)
    
    # HTTP exceptions
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    
    # Catch-all for unhandled exceptions
    app.add_exception_handler(Exception, unhandled_exception_handler)
    
    logger.info("Exception handlers registered successfully")
