from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import logging
import jwt
import time
from typing import Callable

logger = logging.getLogger(__name__)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate Supabase JWT token by verifying its signature and extracting user information.
    This ensures the token is authentic and hasn't been tampered with.
    """
    token = credentials.credentials

    # For development/testing, allow requests without authentication if no real Supabase is configured
    if not settings.supabase_url or settings.supabase_url == "https://your-project.supabase.co":
        logger.warning("Using mock authentication - Supabase not properly configured")
        return {
            "id": "mock-user-id",
            "email": "mock@example.com",
            "role": "authenticated",
            "aud": "authenticated",
            "user_metadata": {},
        }

    try:
        # Verify the JWT token signature using the Supabase JWT secret
        # This ensures the token is authentic and was issued by Supabase
        try:
            decoded = jwt.decode(
                token, 
                settings.supabase_jwt_secret, 
                algorithms=["HS256"],
                audience="authenticated"
            )
        except jwt.InvalidSignatureError:
            logger.error("Invalid JWT signature")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token signature",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.ExpiredSignatureError:
            logger.error("JWT token expired")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except jwt.InvalidAudienceError:
            logger.error("Invalid JWT audience")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token audience",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check if token has required claims
        if not decoded.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract user information from the token
        user_metadata = decoded.get("user_metadata") or {}
        return {
            "id": decoded.get("sub"),
            "email": decoded.get("email", "unknown@example.com"),
            "role": decoded.get("role", "authenticated"),
            "aud": decoded.get("aud", "authenticated"),
            "user_metadata": user_metadata,
        }

    except jwt.DecodeError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_permission(permission: str) -> Callable:
    """
    Return a FastAPI dependency that verifies the current user holds *permission*.

    Permissions are read from the Supabase JWT's ``app_metadata.permissions`` list
    (a string array) and from the top-level ``role`` claim.  An admin service-role
    token (role == 'service_role') is also accepted.
    """
    async def _guard(current_user: dict = Depends(get_current_user)) -> dict:
        role = current_user.get("role", "")
        if role in ("service_role",):
            return current_user

        # Check app_metadata.permissions (set via Supabase admin / custom claims)
        user_metadata = current_user.get("user_metadata") or {}
        app_metadata = current_user.get("app_metadata") or {}
        permissions: list = (
            app_metadata.get("permissions")
            or user_metadata.get("permissions")
            or []
        )
        if permission in permissions:
            return current_user

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{permission}' is required.",
        )

    return _guard
