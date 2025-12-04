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
from app.core.rate_limit import RateLimitMiddleware
from app.core.request_limit import RequestSizeLimitMiddleware
from app.api.v1.routers import enrollment_router, documents_router, academic_router, financing_router, next_of_kin_router, fees_router

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SecurityHeadersMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                # Add security headers
                headers.append([b"X-Content-Type-Options", b"nosniff"])
                headers.append([b"X-Frame-Options", b"SAMEORIGIN"])
                headers.append([b"X-XSS-Protection", b"1; mode=block"])
                headers.append([b"Strict-Transport-Security", b"max-age=31536000; includeSubDomains"])
                headers.append([b"Content-Security-Policy", b"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"])
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)

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

# CORS middleware - MUST be added first (processes last in stack)
# Detect production: either ENVIRONMENT=production or SUPABASE_URL is set (deployed)
is_production = os.getenv("ENVIRONMENT", "development") == "production" or bool(os.getenv("SUPABASE_URL"))

# Always include these Render URLs
render_frontend_url = "https://parent-registration-frontend.onrender.com"
render_backend_url = "https://parent-registration.onrender.com"

# Build allowed origins list
allowed_origins = []

# Add environment variable URLs
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))
if os.getenv("RENDER_DEPLOYMENT_URL"):
    allowed_origins.append(os.getenv("RENDER_DEPLOYMENT_URL"))

# Always add Render default URLs
if render_frontend_url not in allowed_origins:
    allowed_origins.append(render_frontend_url)
if render_backend_url not in allowed_origins:
    allowed_origins.append(render_backend_url)

# Always add localhost for development/debugging
localhost_urls = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]
for url in localhost_urls:
    if url not in allowed_origins:
        allowed_origins.append(url)

logger.info(f"CORS enabled: is_production={is_production}")
logger.info(f"CORS allowed origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
    expose_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

# Request size limiting middleware (should be early in middleware stack)
app.add_middleware(RequestSizeLimitMiddleware, max_body_size=10 * 1024 * 1024)  # 10MB default

# Rate limiting middleware (should be early in middleware stack)
# Global rate limit - 60 requests per minute per IP
app.add_middleware(RateLimitMiddleware, requests_per_minute=60)

# Note: For endpoint-specific rate limits (e.g., file uploads, auth endpoints),
# use the ENDPOINT_RATE_LIMITS configuration in rate_limit.py or implement
# per-route rate limiting in the specific router endpoints

# Add security headers middleware first (executes last)
app.add_middleware(SecurityHeadersMiddleware)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security middleware - Trusted hosts
# Build trusted hosts list based on environment
trusted_hosts = []
if os.getenv("FRONTEND_URL"):
    # Extract hostname from URL
    from urllib.parse import urlparse
    parsed = urlparse(os.getenv("FRONTEND_URL"))
    if parsed.hostname:
        trusted_hosts.append(parsed.hostname)

# Add known deployment URLs
trusted_hosts.extend([
    "localhost",
    "127.0.0.1",
    "parent-registration-frontend.onrender.com",
    "parent-registration.onrender.com",
])

# If RENDER_DEPLOYMENT_URL is set, add it
if os.getenv("RENDER_DEPLOYMENT_URL"):
    parsed = urlparse(os.getenv("RENDER_DEPLOYMENT_URL"))
    if parsed.hostname and parsed.hostname not in trusted_hosts:
        trusted_hosts.append(parsed.hostname)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=trusted_hosts
)

# Performance monitoring middleware
app.add_middleware(PerformanceMiddleware)

# Include routers
app.include_router(enrollment_router, prefix="/api/v1/enrollment", tags=["enrollment"])
app.include_router(documents_router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(academic_router, prefix="/api/v1/academic", tags=["academic"])
app.include_router(financing_router, prefix='/api/v1', tags=['financing'])
app.include_router(next_of_kin_router, prefix="/api/v1/next-of-kin", tags=["next-of-kin"])
app.include_router(fees_router, prefix="/api/v1", tags=["fees"])

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
