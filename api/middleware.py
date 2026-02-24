"""Security middleware for Threat Oracle API."""
import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from api.config import settings

logger = logging.getLogger("threat_oracle.audit")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        return response


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject requests exceeding the configured size limit."""

    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.max_request_size:
            return Response("Request body too large", status_code=413)
        return await call_next(request)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Log all mutating requests for audit trail."""

    async def dispatch(self, request: Request, call_next):
        start = time.monotonic()
        response = await call_next(request)
        duration_ms = (time.monotonic() - start) * 1000

        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            logger.info(
                "AUDIT method=%s path=%s status=%d duration_ms=%.1f client=%s",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                request.client.host if request.client else "unknown",
            )
        return response
