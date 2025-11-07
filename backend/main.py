"""
Main entry point for the FastAPI application.
This file imports and configures the FastAPI app from the app package.
"""

from app.main import app

# The app instance is imported from app.main and can be run with uvicorn
# Run with: uvicorn main:app --host 0.0.0.0 --port 8000 --reload
