import os

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import logging
import uuid
import time

from app.core.config import settings
from app.core.security import get_current_user
from app.api.v1.routers import enrollment_router, documents_router, academic_router, financing_router

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PerformanceMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                process_time = time.time() - start_time
                headers = list(message.get("headers", []))
                headers.append([b"X-Process-Time", f"{process_time:.4f}".encode()])
                message["headers"] = headers
                logger.info(f"Request: {scope['method']} {scope['path']} - Time: {process_time:.4f}s")
            await send(message)

        await self.app(scope, receive, send_wrapper)

app = FastAPI(
    title="School Enrollment API",
    description="API for school enrollment system",
    version="1.0.0"
)

# Performance monitoring middleware
app.add_middleware(PerformanceMiddleware)

# Security middleware - Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS middleware - Production ready
allowed_origins = []

# Add production frontend URL if set (required for production)
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))
else:
    # Only allow localhost in development
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:3001",
        "http://localhost:3002"
    ]

# Add production frontend URL for Render deployment
allowed_origins.append("https://parent-registration-frontend.onrender.com")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(enrollment_router, prefix="/api/v1/enrollment", tags=["enrollment"])
app.include_router(documents_router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(academic_router, prefix="/api/v1/academic", tags=["academic"])
app.include_router(financing_router, prefix='/api/v1', tags=['financing'])

# Add legacy routes for backward compatibility
# Legacy routes removed - now handled by proper API routers

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Global exception handler for better error reporting
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return {
        "detail": str(exc),
        "error_type": type(exc).__name__,
        "path": request.url.path
    }

@app.on_event("startup")
async def startup():
    logger.info("Application starting up...")
    logger.info(f"Frontend URL: {os.getenv('FRONTEND_URL', 'Not set')}")
    logger.info(f"Supabase URL: {os.getenv('SUPABASE_URL', 'Not set')}")
