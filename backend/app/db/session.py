from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
if settings.supabase_url and settings.supabase_anon_key:
    try:
        # Use anon key for auth operations, service key for admin operations
        supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
        logger.info("Supabase client initialized successfully")
    except ImportError as e:
        raise RuntimeError(f"Failed to import Supabase: {e}")
    except Exception as e:
        raise RuntimeError(f"Failed to initialize Supabase client: {e}")
else:
    supabase = None
    logger.warning("Supabase not configured - running without database")
