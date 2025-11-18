from supabase import create_client, Client
import os
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Supabase client with anon key for auth operations
# Try direct env vars first, then VITE_ prefixed ones
supabase_url = settings.supabase_url or settings.vite_supabase_url
supabase_anon_key = settings.supabase_anon_key or settings.vite_supabase_anon_key
supabase_service_key = settings.supabase_service_key or settings.vite_supabase_service_key

if supabase_url and supabase_anon_key:
    try:
        supabase: Client = create_client(supabase_url, supabase_anon_key)
        logger.info("Supabase client initialized successfully with anon key")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        supabase = None
else:
    supabase = None
    logger.warning("Supabase not configured - database operations will fail")

# Initialize Supabase service client with service key for server-side operations
if supabase_url and supabase_service_key:
    try:
        supabase_service: Client = create_client(supabase_url, supabase_service_key)
        logger.info("Supabase service client initialized successfully with service key")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase service client: {e}")
        supabase_service = None
else:
    supabase_service = None
    logger.warning("Supabase service key not configured - server operations may fail")
