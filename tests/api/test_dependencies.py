"""Tests for API dependency injection — API key auth and Neo4j session."""
import pytest
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from api.dependencies import get_neo4j_session, require_api_key


class TestRequireApiKey:
    """Tests for require_api_key dependency."""

    def test_dev_mode_no_key_configured(self):
        """When no key is configured in settings, skip auth (dev mode)."""
        with patch("api.dependencies.settings") as mock_settings:
            mock_settings.threat_oracle_api_key = ""
            result = require_api_key(api_key=None)
            assert result == ""

    def test_dev_mode_ignores_provided_key(self):
        """When no key is configured, any provided key is ignored and returns empty."""
        with patch("api.dependencies.settings") as mock_settings:
            mock_settings.threat_oracle_api_key = ""
            result = require_api_key(api_key="some-random-key")
            assert result == ""

    def test_raises_403_when_key_is_wrong(self):
        """When key is configured but client sends wrong key, 403."""
        with patch("api.dependencies.settings") as mock_settings:
            mock_settings.threat_oracle_api_key = "correct-key"
            with pytest.raises(HTTPException) as exc_info:
                require_api_key(api_key="wrong-key")
            assert exc_info.value.status_code == 403

    def test_raises_403_when_key_is_missing(self):
        """When key is configured but client sends no key, 403."""
        with patch("api.dependencies.settings") as mock_settings:
            mock_settings.threat_oracle_api_key = "correct-key"
            with pytest.raises(HTTPException) as exc_info:
                require_api_key(api_key=None)
            assert exc_info.value.status_code == 403

    def test_passes_when_key_matches(self):
        """When client sends correct key, it passes through."""
        with patch("api.dependencies.settings") as mock_settings:
            mock_settings.threat_oracle_api_key = "correct-key"
            result = require_api_key(api_key="correct-key")
            assert result == "correct-key"

    def test_raises_403_with_empty_string_key(self):
        """When key is configured but client sends empty string, 403."""
        with patch("api.dependencies.settings") as mock_settings:
            mock_settings.threat_oracle_api_key = "correct-key"
            with pytest.raises(HTTPException) as exc_info:
                require_api_key(api_key="")
            assert exc_info.value.status_code == 403


class TestGetNeo4jSession:
    """Tests for get_neo4j_session dependency."""

    @patch("api.dependencies.get_driver")
    def test_yields_session_and_closes(self, mock_get_driver):
        mock_driver = MagicMock()
        mock_session = MagicMock()
        mock_driver.session.return_value = mock_session
        mock_get_driver.return_value = mock_driver

        gen = get_neo4j_session()
        session = next(gen)

        assert session is mock_session
        mock_driver.session.assert_called_once()

        # Trigger cleanup
        with pytest.raises(StopIteration):
            next(gen)

        mock_session.close.assert_called_once()

    @patch("api.dependencies.get_driver")
    def test_session_closed_on_exception(self, mock_get_driver):
        mock_driver = MagicMock()
        mock_session = MagicMock()
        mock_driver.session.return_value = mock_session
        mock_get_driver.return_value = mock_driver

        gen = get_neo4j_session()
        next(gen)

        # Simulate exception cleanup
        with pytest.raises(RuntimeError):
            gen.throw(RuntimeError("boom"))

        mock_session.close.assert_called_once()
