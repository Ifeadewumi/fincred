# app/schemas/common.py
"""
Common schemas and models used across the API.

This module contains reusable Pydantic models for pagination,
standardized responses, and other cross-cutting concerns.
"""
from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field


# Generic type variable for paginated responses
T = TypeVar('T')


class PaginationParams(BaseModel):
    """
    Pagination parameters for list endpoints.
    
    Use as a dependency in FastAPI routes:
        @router.get("/items")
        async def list_items(pagination: Annotated[PaginationParams, Depends()]):
            ...
    """
    limit: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of items to return (1-100)"
    )
    offset: int = Field(
        default=0,
        ge=0,
        description="Number of items to skip"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "limit": 20,
                "offset": 0
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response model.
    
    Provides consistent pagination metadata across all list endpoints.
    
    Example:
        return PaginatedResponse(
            items=goals,
            total=100,
            limit=20,
            offset=0,
            has_more=True
        )
    """
    items: List[T] = Field(description="List of items for current page")
    total: int = Field(description="Total number of items across all pages")
    limit: int = Field(description="Maximum number of items per page")
    offset: int = Field(description="Number of items skipped")
    has_more: bool = Field(description="Whether more items are available")
    
    class Config:
        json_schema_extra = {
            "example": {
                "items": [],
                "total": 100,
                "limit": 20,
                "offset": 0,
                "has_more": True
            }
        }


class SuccessResponse(BaseModel):
    """
    Standard success response for operations without data return.
    
    Use for operations like delete, update confirm, etc.
    """
    success: bool = Field(default=True, description="Operation success status")
    message: str = Field(description="Success message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Operation completed successfully"
            }
        }


class ErrorDetail(BaseModel):
    """
    Detailed error information.
    
    Provides structured error details for validation failures.
    """
    field: Optional[str] = Field(None, description="Field that caused the error")
    message: str = Field(description="Error message")
    code: Optional[str] = Field(None, description="Error code for programmatic handling")
    
    class Config:
        json_schema_extra = {
            "example": {
                "field": "target_amount",
                "message": "Target amount must be greater than 0",
                "code": "VALUE_ERROR"
            }
        }


class ErrorResponse(BaseModel):
    """
    Standard error response format.
    
    Provides consistent error structure across the API.
    """
    success: bool = Field(default=False, description="Operation success status")
    error: str = Field(description="Error message")
    details: Optional[List[ErrorDetail]] = Field(None, description="Detailed error information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": False,
                "error": "Validation failed",
                "details": [
                    {
                        "field": "target_amount",
                        "message": "Target amount must be greater than 0",
                        "code": "VALUE_ERROR"
                    }
                ]
            }
        }
