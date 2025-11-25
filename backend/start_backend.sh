#!/bin/bash
# Load environment variables from .env file in current directory
set -a
source ./backend/.env
set +a

# Activate virtual environment
source ./backend/.venv/bin/activate

# Run uvicorn server
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
