# app/core/middleware.py
"""
Custom middleware components for request processing, security, and observability.
"""
import time
import uuid
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import FastAPI


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add a unique request ID to each incoming request.
    
    The request ID is:
    - Generated if not provided in X-Request-ID header
    - Added to request.state for access in route handlers
    - Included in response headers for client correlation
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if request already has an ID from the client
        request_id = request.headers.get("X-Request-ID")
        
        if not request_id:
            # Generate a new unique request ID
            request_id = str(uuid.uuid4())
        
        # Store in request state for logging and route access
        request.state.request_id = request_id
        
        # Process the request
        response = await call_next(request)
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response


class RequestTimingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to track request processing time.
    
    Adds X-Process-Time header to responses with time in milliseconds.
    Useful for performance monitoring and optimization.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.perf_counter()
        
        response = await call_next(request)
        
        process_time = (time.perf_counter() - start_time) * 1000  # Convert to milliseconds
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses.
    
    Implements OWASP recommended security headers:
    - X-Content-Type-Options: Prevent MIME type sniffing
    - X-Frame-Options: Prevent clickjacking
    - X-XSS-Protection: Enable XSS filter (legacy browsers)
    - Strict-Transport-Security: Enforce HTTPS
    - Content-Security-Policy: Restrict resource loading
    """
    
    def __init__(self, app: FastAPI, enable_hsts: bool = False):
        super().__init__(app)
        self.enable_hsts = enable_hsts
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Prevent clickjacking by disallowing iframe embedding
        response.headers["X-Frame-Options"] = "DENY"
        
        # Enable XSS protection (legacy browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Enforce HTTPS (only in production with HTTPS enabled)
        if self.enable_hsts:
            # max-age=31536000 = 1 year
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy - restrictive default
        # Note: Adjust based on frontend requirements
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'"
        )
        
        # Referrer policy - don't leak referrer info
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions policy - disable unnecessary browser features
        response.headers["Permissions-Policy"] = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "accelerometer=()"
        )
        
        return response


def setup_middleware(app: FastAPI, enable_hsts: bool = False) -> None:
    """
    Configure all custom middleware for the application.
    
    Args:
        app: FastAPI application instance
        enable_hsts: Enable HTTP Strict Transport Security (production only)
    """
    # Order matters! Middleware is applied in reverse order (bottom to top)
    # So the first registered middleware runs last
    
    # Security headers should be added to every response
    app.add_middleware(SecurityHeadersMiddleware, enable_hsts=enable_hsts)
    
    # Request timing for performance monitoring
    app.add_middleware(RequestTimingMiddleware)
    
    # Request ID for tracing and correlation
    app.add_middleware(RequestIDMiddleware)
