import os
import pytest
from pydantic import ValidationError

# Set dummy environment variables for testing
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test_anon_key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test_service_key"
os.environ["SUPABASE_JWT_SECRET"] = "test_jwt_secret"
os.environ["RETURN_URL"] = "http://localhost:3000"
os.environ["WEBHOOK_URL"] = "http://localhost:8000"

from app.core.config import Settings

def test_settings_load_successfully():
    """Test that settings are loaded correctly from environment variables."""
    settings = Settings()
    assert settings.supabase_url == "https://test.supabase.co"
    assert settings.supabase_anon_key == "test_anon_key"
    assert settings.supabase_service_key == "test_service_key"
    assert settings.supabase_jwt_secret == "test_jwt_secret"

def test_settings_missing_variable_raises_error():
    """Test that a missing required environment variable raises a validation error."""
    # Unset a required variable
    original_value = os.environ.pop("SUPABASE_URL", None)

    with pytest.raises(ValidationError):
        Settings()

    # Restore the environment variable
    if original_value is not None:
        os.environ["SUPABASE_URL"] = original_value

