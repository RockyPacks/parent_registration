from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    supabase_service_key: Optional[str] = None

    # Netcash Risk Reports API
    netcash_risk_base: str = "https://ws.netcash.co.za/RiskReportsService.svc"
    netcash_risk_key: Optional[str] = None

    # Application Settings
    debug: bool = False
    secret_key: str = "your-secret-key-here"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
