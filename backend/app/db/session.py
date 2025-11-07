from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client
if not settings.supabase_url or not settings.supabase_anon_key:
    raise RuntimeError("Supabase URL and key must be configured")

try:
    key_to_use = settings.supabase_service_key if settings.supabase_service_key else settings.supabase_anon_key
    supabase: Client = create_client(settings.supabase_url, key_to_use)
    logger.info("Supabase client initialized successfully")
except ImportError as e:
    raise RuntimeError(f"Failed to import Supabase: {e}")
except Exception as e:
    raise RuntimeError(f"Failed to initialize Supabase client: {e}")
