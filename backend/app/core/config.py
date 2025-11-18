from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: Optional[str] = None
    supabase_anon_key: Optional[str] = None
    supabase_service_key: Optional[str] = Field(None, env="SUPABASE_SERVICE_ROLE_KEY")
    vite_supabase_url: Optional[str] = None
    vite_supabase_anon_key: Optional[str] = None
    vite_supabase_service_key: Optional[str] = None
    supabase_jwt_secret: Optional[str] = Field(None, env="SUPABASE_JWT_SECRET", json_schema_extra={"env": "SUPABASE_JWT_SECRET"})

    # Payment URLs
    return_url: Optional[str] = None
    webhook_url: Optional[str] = None

    # Application Settings
    debug: bool = False
    secret_key: str = "your-secret-key-here"

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate required production environment variables
        if not self.supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.supabase_anon_key:
            raise ValueError("SUPABASE_ANON_KEY environment variable is required")
        if not self.supabase_service_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
        if not self.supabase_jwt_secret:
            raise ValueError("SUPABASE_JWT_SECRET environment variable is required")

    @property
    def supabase(self):
        """Get Supabase client instance"""
        from app.db.supabase_client import supabase
        return supabase


settings = Settings()
