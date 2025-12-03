"""
File upload rate limiting decorator
Provides additional rate limiting specifically for file upload endpoints
"""

import time
from collections import defaultdict
from functools import wraps
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class FileUploadRateLimiter:
    """
    Rate limiter specifically for file uploads.
    Tracks both number of uploads and total bytes uploaded per user.
    """
    
    def __init__(
        self, 
        max_uploads_per_hour: int = 20,
        max_bytes_per_hour: int = 50 * 1024 * 1024  # 50MB per hour
    ):
        self.max_uploads_per_hour = max_uploads_per_hour
        self.max_bytes_per_hour = max_bytes_per_hour
        self.upload_counts = defaultdict(list)  # user_id -> [(timestamp, bytes)]
        self.last_cleanup = time.time()

    def check_limit(self, user_id: str, file_size: int) -> bool:
        """
        Check if user is within upload limits.
        Returns True if upload is allowed, False otherwise.
        """
        now = time.time()
        one_hour_ago = now - 3600
        
        # Clean up old entries
        if now - self.last_cleanup > 300:  # Every 5 minutes
            self._cleanup()
            self.last_cleanup = now
        
        # Get uploads from last hour
        recent_uploads = [
            (timestamp, size) for timestamp, size in self.upload_counts[user_id]
            if timestamp > one_hour_ago
        ]
        
        # Update the list with only recent uploads
        self.upload_counts[user_id] = recent_uploads
        
        # Check upload count limit
        if len(recent_uploads) >= self.max_uploads_per_hour:
            logger.warning(f"Upload count limit exceeded for user {user_id}: {len(recent_uploads)}/{self.max_uploads_per_hour}")
            return False
        
        # Check total bytes limit
        total_bytes = sum(size for _, size in recent_uploads)
        if total_bytes + file_size > self.max_bytes_per_hour:
            logger.warning(f"Upload size limit exceeded for user {user_id}: {total_bytes + file_size}/{self.max_bytes_per_hour} bytes")
            return False
        
        # Add current upload
        self.upload_counts[user_id].append((now, file_size))
        return True

    def _cleanup(self):
        """Remove old entries to prevent memory leaks"""
        now = time.time()
        one_hour_ago = now - 3600
        
        users_to_remove = []
        for user_id, uploads in self.upload_counts.items():
            # Filter out old uploads
            self.upload_counts[user_id] = [
                (timestamp, size) for timestamp, size in uploads
                if timestamp > one_hour_ago
            ]
            
            # Mark for removal if no recent uploads
            if not self.upload_counts[user_id]:
                users_to_remove.append(user_id)
        
        for user_id in users_to_remove:
            del self.upload_counts[user_id]
        
        logger.debug(f"File upload rate limiter cleanup: removed {len(users_to_remove)} inactive users")


# Global instance
file_upload_limiter = FileUploadRateLimiter(
    max_uploads_per_hour=20,
    max_bytes_per_hour=50 * 1024 * 1024  # 50MB per hour
)


def check_file_upload_limit(user_id: str, file_size: int):
    """
    Check if file upload is within rate limits.
    Raises HTTPException if limit is exceeded.
    """
    if not file_upload_limiter.check_limit(user_id, file_size):
        raise HTTPException(
            status_code=429,
            detail="File upload rate limit exceeded. Maximum 20 uploads or 50MB per hour."
        )
