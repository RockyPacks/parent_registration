"""
Request size limiting middleware for FastAPI
Prevents large payload attacks and memory exhaustion
"""

import logging
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class RequestSizeLimitMiddleware:
    """
    Middleware to limit request body size.
    
    Default limits:
    - General requests: 10MB
    - File uploads: 50MB  (configurable)
    """
    
    def __init__(self, app, max_body_size: int = 10 * 1024 * 1024):  # 10MB default
        self.app = app
        self.max_body_size = max_body_size
        # Specific limits for certain endpoints (in bytes)
        self.endpoint_limits = {
            "/api/v1/documents/upload": 50 * 1024 * 1024,  # 50MB for file uploads
        }

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Get the path to check against endpoint limits
        path = scope.get("path", "")
        
        # Determine the limit for this request
        limit = self.max_body_size
        for endpoint, endpoint_limit in self.endpoint_limits.items():
            if path.startswith(endpoint):
                limit = endpoint_limit
                break

        # Get Content-Length header
        headers = dict(scope.get("headers", []))
        content_length = headers.get(b"content-length", None)
        
        if content_length:
            try:
                content_length = int(content_length)
                if content_length > limit:
                    logger.warning(
                        f"Request size {content_length} bytes exceeds limit {limit} bytes "
                        f"for {scope['method']} {path}"
                    )
                    response = JSONResponse(
                        status_code=413,
                        content={
                            "detail": f"Request body too large. Maximum allowed size: {limit // (1024*1024)}MB"
                        },
                    )
                    await response(scope, receive, send)
                    return
            except (ValueError, TypeError):
                pass

        await self.app(scope, receive, send)
