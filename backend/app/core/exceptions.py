"""
Custom exception classes for the application.
Provides consistent error handling and HTTP status code mapping.
"""

from typing import Dict, Any, Optional
from fastapi import HTTPException


class ApplicationError(Exception):
    """Base exception class for application-specific errors."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(ApplicationError):
    """Exception raised for authentication failures."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message, status_code=401)


class AuthorizationError(ApplicationError):
    """Exception raised for authorization failures."""

    def __init__(self, message: str = "Access denied"):
        super().__init__(message, status_code=403)


class NotFoundError(ApplicationError):
    """Exception raised when a resource is not found."""

    def __init__(self, resource: str = "Resource"):
        super().__init__(f"{resource} not found", status_code=404)


class ValidationError(ApplicationError):
    """Exception raised for validation failures."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, details=details)


class ExternalServiceError(ApplicationError):
    """Exception raised when external service calls fail."""

    def __init__(self, service: str, message: str):
        super().__init__(f"{service} error: {message}", status_code=502)


class ConfigurationError(ApplicationError):
    """Exception raised for configuration issues."""

    def __init__(self, message: str):
        super().__init__(f"Configuration error: {message}", status_code=500)


def handle_application_error(error: ApplicationError) -> HTTPException:
    """Convert ApplicationError to FastAPI HTTPException."""
    return HTTPException(
        status_code=error.status_code,
        detail={
            "message": error.message,
            "details": error.details
        }
    )


def handle_generic_error(error: Exception, status_code: int = 500) -> HTTPException:
    """Convert generic exceptions to FastAPI HTTPException."""
    return HTTPException(
        status_code=status_code,
        detail={
            "message": str(error),
            "type": error.__class__.__name__
        }
    )
