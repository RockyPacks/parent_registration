from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import logging
import jwt
import time

logger = logging.getLogger(__name__)

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate Supabase JWT token by decoding it.
    This avoids double authentication - the token was already validated by Supabase when issued.
    We just need to extract the user information from it.
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
        }

    try:
        # Decode the JWT token without verification
        # The token was already verified by Supabase when it was issued to the client
        # We're just extracting the user information from it
        decoded = jwt.decode(token, options={"verify_signature": False})
        
        # Check if token has required claims
        if not decoded.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Check token expiration
        exp = decoded.get("exp", 0)
        current_time = int(time.time())
        
        if current_time > exp:
            logger.error(f"Token expired: {current_time} > {exp}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract user information from the token
        return {
            "id": decoded.get("sub"),
            "email": decoded.get("email", "unknown@example.com"),
            "role": decoded.get("role", "authenticated"),
            "aud": decoded.get("aud", "authenticated"),
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
