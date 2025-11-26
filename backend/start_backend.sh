#!/bin/bash
# Load environment variables from .env file in current directory
set -a
source .env
set +a

# Activate virtual environment
source .venv/bin/activate

# Run uvicorn server
uvicorn app.main:app --host 0.0.0.0 --port 8000
