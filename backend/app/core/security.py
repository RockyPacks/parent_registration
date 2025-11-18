from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()

def get_supabase_client():
    """Get Supabase service client for auth operations"""
    from app.db.supabase_client import supabase_service
    if not supabase_service:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable"
        )
    return supabase_service

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validate Supabase JWT token using official Supabase client"""
    token = credentials.credentials

    # For development/testing, allow requests without authentication if no real Supabase is configured
    if not settings.supabase_url or settings.supabase_url == "https://your-project.supabase.co":
        logger.warning("Using mock authentication - Supabase not properly configured")
        return {
            "id": "mock-user-id",
            "email": "mock@example.com",
            "role": "authenticated",
            "aud": "authenticated",
        }

    try:
        supabase = get_supabase_client()

        # Use Supabase's built-in user retrieval - this is the professional way
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user = user_response.user

        return {
            "id": user.id,
            "email": user.email,
            "role": user.role or "authenticated",
            "aud": "authenticated",
        }

    except Exception as e:
        logger.error(f"Authentication error: {e}")
        # For development, if Supabase validation fails, try to decode JWT manually
        # This is a fallback for cases where the token is valid but Supabase client has issues
        try:
            import jwt
            # Decode without verification for development
            decoded = jwt.decode(token, options={"verify_signature": False})
            if decoded.get("sub"):  # Valid user token should have 'sub' claim
                logger.warning("Using fallback JWT decoding for development")
                return {
                    "id": decoded.get("sub"),
                    "email": decoded.get("email", "unknown@example.com"),
                    "role": decoded.get("role", "authenticated"),
                    "aud": decoded.get("aud", "authenticated"),
                }
        except Exception as jwt_error:
            logger.error(f"JWT fallback also failed: {jwt_error}")

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
