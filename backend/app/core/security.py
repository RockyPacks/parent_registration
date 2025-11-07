from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import HTTPException, Depends
from typing import Optional
import logging

logger = logging.getLogger(__name__)

security = HTTPBearer()


def get_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return credentials.credentials


def verify_supabase_token(token: str):
    try:
        # Import supabase client here to avoid circular imports
        from app.db.session import supabase
        user = supabase.auth.get_user(token)
        return user
    except Exception:
        raise HTTPException(status_code=403, detail="Invalid token")


def get_current_user(token: str = Depends(get_token)):
    try:
        # Import supabase client here to avoid circular imports
        from app.db.session import supabase
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": user.id,
            "email": user.email,
            "user_metadata": user.user_metadata
        }
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
