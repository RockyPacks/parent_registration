from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_anon_key: str
    supabase_service_key: Optional[str] = None

    # Netcash Payment API (PayNow)
    netcash_api_url: str = "https://paynow.netcash.co.za/site/paynow.aspx"
    netcash_service_key: Optional[str] = None
    netcash_service_password: Optional[str] = None

    # Netcash PayNow Integration
    netcash_paynow_service_key: Optional[str] = None
    netcash_paynow_base: str = "https://ws.netcash.co.za/PayNowService.svc"
    return_url: Optional[str] = None
    webhook_url: Optional[str] = None
    netcash_webhook_secret: Optional[str] = None

    # Netcash Risk Reports API
    netcash_risk_base: str = "https://ws.netcash.co.za/RiskReportsService.svc"
    netcash_risk_service_key: Optional[str] = None

    # Application Settings
    debug: bool = False
    secret_key: str = "your-secret-key-here"

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "extra": "ignore"
    }


settings = Settings()
