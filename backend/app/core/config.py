from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    # Supabase Configuration
    # These fields are now required. Pydantic will raise an error if they are not found.
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: str = Field(alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(alias="SUPABASE_JWT_SECRET")

    # Payment URLs
    return_url: str
    webhook_url: str

    # Application Settings
    debug: bool = False
    secret_key: str = "your-secret-key-here"
    frontend_url: str = "http://localhost:3000"

    model_config = {
        "env_file": str(Path(__file__).resolve().parents[2] / ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }



settings = Settings()
