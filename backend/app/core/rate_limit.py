"""
Rate limiting middleware for FastAPI
Implements per-IP request rate limiting to prevent DoS attacks
"""

import time
from collections import defaultdict
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """
    Rate limiting middleware that tracks requests per IP address.
    
    Configuration:
    - requests_per_minute: Maximum requests allowed per minute per IP (default: 60)
    - cleanup_interval: How often to clean old entries (default: 60 seconds)
    """
    
    def __init__(self, app, requests_per_minute: int = 60, cleanup_interval: int = 60):
        self.app = app
        self.requests_per_minute = requests_per_minute
        self.cleanup_interval = cleanup_interval
        self.requests = defaultdict(list)
        self.last_cleanup = time.time()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Get client IP
        client_ip = self._get_client_ip(scope)
        
        # Check rate limit
        if not self._check_rate_limit(client_ip):
            response = JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Maximum 60 requests per minute."},
            )
            await response(scope, receive, send)
            return

        await self.app(scope, receive, send)

    def _get_client_ip(self, scope) -> str:
        """Extract client IP from request scope, handling proxies"""
        headers = dict(scope.get("headers", []))
        
        # Check for X-Forwarded-For header (for proxies, take first IP)
        if b"x-forwarded-for" in headers:
            return headers[b"x-forwarded-for"].decode().split(",")[0].strip()
        
        # Check for X-Real-IP header
        if b"x-real-ip" in headers:
            return headers[b"x-real-ip"].decode()
        
        # Fall back to direct connection
        client = scope.get("client")
        if client:
            return client[0]
        
        return "unknown"

    def _check_rate_limit(self, client_ip: str) -> bool:
        """Check if request is within rate limit"""
        now = time.time()
        
        # Clean up old entries periodically
        if now - self.last_cleanup > self.cleanup_interval:
            self._cleanup_old_entries(now)
            self.last_cleanup = now
        
        # Get requests from the last minute
        one_minute_ago = now - 60
        self.requests[client_ip] = [
            timestamp for timestamp in self.requests[client_ip]
            if timestamp > one_minute_ago
        ]
        
        # Check if limit exceeded
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return False
        
        # Add current request
        self.requests[client_ip].append(now)
        return True

    def _cleanup_old_entries(self, now: float):
        """Remove IPs with no recent requests to prevent memory leaks"""
        one_minute_ago = now - 120  # Keep data for 2 minutes
        ips_to_remove = []
        
        for ip, timestamps in self.requests.items():
            # Remove timestamps older than 2 minutes
            self.requests[ip] = [ts for ts in timestamps if ts > one_minute_ago]
            
            # Remove IP if no requests
            if not self.requests[ip]:
                ips_to_remove.append(ip)
        
        for ip in ips_to_remove:
            del self.requests[ip]
        
        logger.debug(f"Rate limiter cleanup: removed {len(ips_to_remove)} inactive IPs")


# Endpoint-specific rate limiters for more granular control
ENDPOINT_RATE_LIMITS = {
    # Authentication endpoints - stricter limits
    "/api/v1/auth/login": {"requests_per_minute": 5},
    "/api/v1/auth/register": {"requests_per_minute": 3},
    
    # File upload - moderate limits (file uploads are slower)
    "/api/v1/documents/upload": {"requests_per_minute": 10},
    
    # General API - standard limits
    "/api/v1/enrollment": {"requests_per_minute": 60},
    "/api/v1/academic": {"requests_per_minute": 60},
}
