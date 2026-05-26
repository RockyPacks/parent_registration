from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator

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

    # Experian PVS-E Configuration
    experian_uat_base_url: str = "https://apis-uat.experian.co.za:9443/PvseService"
    experian_prod_base_url: str = "https://apis.experian.co.za:9443/PvseService"
    experian_username: str = ""
    experian_password: str = ""
    experian_subscriber_code: str = "35052-REA"
    experian_accuracy_threshold: int = 65
    experian_timeout_seconds: int = 60
    experian_environment: str = "uat"

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str) and value.lower() in {"release", "production", "prod"}:
            return False
        return value

    model_config = {
        "env_file": str(Path(__file__).resolve().parents[2] / ".env"),
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore"
    }



settings = Settings()
