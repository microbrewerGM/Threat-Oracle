"""Tests for API middleware — security headers, request size, audit logging."""
import logging
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.responses import PlainTextResponse

from api.middleware import (
    AuditLogMiddleware,
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware,
)


def _make_app(*middlewares) -> FastAPI:
    """Create a minimal FastAPI app with the given middleware stack."""
    app = FastAPI()

    for mw in middlewares:
        app.add_middleware(mw)

    @app.get("/test")
    def _get():
        return PlainTextResponse("ok")

    @app.post("/test")
    def _post():
        return PlainTextResponse("ok")

    return app


class TestSecurityHeadersMiddleware:
    """Verify SecurityHeadersMiddleware adds all expected headers."""

    def setup_method(self):
        app = _make_app(SecurityHeadersMiddleware)
        self.client = TestClient(app)

    def test_x_content_type_options(self):
        resp = self.client.get("/test")
        assert resp.headers["X-Content-Type-Options"] == "nosniff"

    def test_x_frame_options(self):
        resp = self.client.get("/test")
        assert resp.headers["X-Frame-Options"] == "DENY"

    def test_x_xss_protection(self):
        resp = self.client.get("/test")
        assert resp.headers["X-XSS-Protection"] == "1; mode=block"

    def test_referrer_policy(self):
        resp = self.client.get("/test")
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

    def test_cache_control(self):
        resp = self.client.get("/test")
        assert resp.headers["Cache-Control"] == "no-store"

    def test_permissions_policy(self):
        resp = self.client.get("/test")
        assert resp.headers["Permissions-Policy"] == "geolocation=(), camera=(), microphone=()"

    def test_headers_on_post(self):
        resp = self.client.post("/test")
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["Cache-Control"] == "no-store"


class TestRequestSizeLimitMiddleware:
    """Verify RequestSizeLimitMiddleware rejects oversized requests."""

    def test_small_request_passes(self):
        with patch("api.middleware.settings") as mock_settings:
            mock_settings.max_request_size = 1_000_000
            app = _make_app(RequestSizeLimitMiddleware)
            client = TestClient(app)
            resp = client.get("/test")
            assert resp.status_code == 200

    def test_oversized_request_rejected(self):
        with patch("api.middleware.settings") as mock_settings:
            mock_settings.max_request_size = 10  # 10 bytes
            app = _make_app(RequestSizeLimitMiddleware)
            client = TestClient(app)
            resp = client.post(
                "/test",
                content="x" * 100,
                headers={"content-length": "100"},
            )
            assert resp.status_code == 413
            assert "too large" in resp.text.lower()

    def test_request_at_limit_passes(self):
        with patch("api.middleware.settings") as mock_settings:
            mock_settings.max_request_size = 100
            app = _make_app(RequestSizeLimitMiddleware)
            client = TestClient(app)
            resp = client.post(
                "/test",
                content="x" * 100,
                headers={"content-length": "100"},
            )
            assert resp.status_code == 200

    def test_request_without_content_length_passes(self):
        with patch("api.middleware.settings") as mock_settings:
            mock_settings.max_request_size = 10
            app = _make_app(RequestSizeLimitMiddleware)
            client = TestClient(app)
            # GET requests typically have no content-length
            resp = client.get("/test")
            assert resp.status_code == 200


class TestAuditLogMiddleware:
    """Verify AuditLogMiddleware logs mutating requests."""

    def test_post_is_logged(self, caplog):
        app = _make_app(AuditLogMiddleware)
        client = TestClient(app)
        with caplog.at_level(logging.INFO, logger="threat_oracle.audit"):
            client.post("/test")
        assert any("AUDIT" in r.message and "POST" in r.message for r in caplog.records)

    def test_get_is_not_logged(self, caplog):
        app = _make_app(AuditLogMiddleware)
        client = TestClient(app)
        with caplog.at_level(logging.INFO, logger="threat_oracle.audit"):
            client.get("/test")
        assert not any("AUDIT" in r.message for r in caplog.records)

    def test_log_includes_path_and_status(self, caplog):
        app = _make_app(AuditLogMiddleware)
        client = TestClient(app)
        with caplog.at_level(logging.INFO, logger="threat_oracle.audit"):
            client.post("/test")
        audit_records = [r for r in caplog.records if "AUDIT" in r.message]
        assert len(audit_records) >= 1
        msg = audit_records[0].message
        assert "path=/test" in msg
        assert "status=200" in msg

    def test_log_includes_duration(self, caplog):
        app = _make_app(AuditLogMiddleware)
        client = TestClient(app)
        with caplog.at_level(logging.INFO, logger="threat_oracle.audit"):
            client.post("/test")
        audit_records = [r for r in caplog.records if "AUDIT" in r.message]
        assert len(audit_records) >= 1
        assert "duration_ms=" in audit_records[0].message
