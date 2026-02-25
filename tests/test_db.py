"""Tests for src.db — Neo4j driver singleton and session management."""
import pytest
from unittest.mock import MagicMock, patch


class TestGetNeo4jConfig:
    """Tests for get_neo4j_config()."""

    @patch.dict("os.environ", {"NEO4J_URI": "bolt://localhost:7687", "NEO4J_PASSWORD": "secret"})
    def test_reads_uri_and_password(self):
        from src.db import get_neo4j_config

        config = get_neo4j_config()
        assert config["uri"] == "bolt://localhost:7687"
        assert config["password"] == "secret"

    @patch.dict("os.environ", {}, clear=True)
    def test_defaults_when_env_vars_missing(self):
        from src.db import get_neo4j_config

        config = get_neo4j_config()
        assert config["uri"] == ""
        assert config["username"] == "neo4j"
        assert config["password"] == ""
        assert config["encrypted"] is False

    @patch.dict("os.environ", {"NEO4J_USERNAME": "admin"}, clear=True)
    def test_reads_custom_username(self):
        from src.db import get_neo4j_config

        config = get_neo4j_config()
        assert config["username"] == "admin"

    @patch.dict("os.environ", {"NEO4J_ENCRYPTED": "true"}, clear=True)
    def test_encrypted_true(self):
        from src.db import get_neo4j_config

        config = get_neo4j_config()
        assert config["encrypted"] is True

    @patch.dict("os.environ", {"NEO4J_ENCRYPTED": "1"}, clear=True)
    def test_encrypted_1(self):
        from src.db import get_neo4j_config

        config = get_neo4j_config()
        assert config["encrypted"] is True

    @patch.dict("os.environ", {"NEO4J_ENCRYPTED": "yes"}, clear=True)
    def test_encrypted_yes(self):
        from src.db import get_neo4j_config

        config = get_neo4j_config()
        assert config["encrypted"] is True

    @patch.dict("os.environ", {"NEO4J_ENCRYPTED": "false"}, clear=True)
    def test_encrypted_false(self):
        from src.db import get_neo4j_config

        config = get_neo4j_config()
        assert config["encrypted"] is False


class TestGetDriver:
    """Tests for get_driver() singleton."""

    def setup_method(self):
        """Reset the singleton before each test."""
        import src.db

        src.db._driver = None

    def teardown_method(self):
        """Reset the singleton after each test."""
        import src.db

        src.db._driver = None

    @patch.dict("os.environ", {}, clear=True)
    def test_raises_when_uri_missing(self):
        from src.db import get_driver

        with pytest.raises(ValueError, match="NEO4J_URI"):
            get_driver()

    @patch.dict("os.environ", {"NEO4J_URI": "bolt://localhost:7687"}, clear=True)
    def test_raises_when_password_missing(self):
        from src.db import get_driver

        with pytest.raises(ValueError, match="NEO4J_PASSWORD"):
            get_driver()

    @patch("src.db.GraphDatabase")
    @patch.dict(
        "os.environ",
        {"NEO4J_URI": "bolt://localhost:7687", "NEO4J_PASSWORD": "pass"},
    )
    def test_returns_singleton(self, mock_gdb):
        from src.db import get_driver

        mock_gdb.driver.return_value = MagicMock()
        d1 = get_driver()
        d2 = get_driver()
        assert d1 is d2
        mock_gdb.driver.assert_called_once()

    @patch("src.db.GraphDatabase")
    @patch.dict(
        "os.environ",
        {
            "NEO4J_URI": "bolt://localhost:7687",
            "NEO4J_PASSWORD": "pass",
            "NEO4J_ENCRYPTED": "true",
        },
    )
    def test_encrypted_kwarg_passed(self, mock_gdb):
        from src.db import get_driver

        mock_gdb.driver.return_value = MagicMock()
        get_driver()
        _, kwargs = mock_gdb.driver.call_args
        assert kwargs["encrypted"] is True


class TestCloseDriver:
    """Tests for close_driver()."""

    def setup_method(self):
        import src.db

        src.db._driver = None

    def teardown_method(self):
        import src.db

        src.db._driver = None

    def test_close_resets_singleton(self):
        import src.db
        from src.db import close_driver

        mock_driver = MagicMock()
        src.db._driver = mock_driver

        close_driver()

        mock_driver.close.assert_called_once()
        assert src.db._driver is None

    def test_close_noop_when_no_driver(self):
        from src.db import close_driver

        # Should not raise
        close_driver()


class TestGetSession:
    """Tests for get_session() context manager."""

    def setup_method(self):
        import src.db

        src.db._driver = None

    def teardown_method(self):
        import src.db

        src.db._driver = None

    @patch("src.db.get_driver")
    def test_yields_session_and_closes(self, mock_get_driver):
        from src.db import get_session

        mock_driver = MagicMock()
        mock_session = MagicMock()
        mock_driver.session.return_value = mock_session
        mock_get_driver.return_value = mock_driver

        with get_session() as session:
            assert session is mock_session

        mock_session.close.assert_called_once()

    @patch("src.db.get_driver")
    def test_session_closed_on_exception(self, mock_get_driver):
        from src.db import get_session

        mock_driver = MagicMock()
        mock_session = MagicMock()
        mock_driver.session.return_value = mock_session
        mock_get_driver.return_value = mock_driver

        with pytest.raises(RuntimeError):
            with get_session() as session:
                raise RuntimeError("boom")

        mock_session.close.assert_called_once()


class TestVerifyConnectivity:
    """Tests for verify_connectivity()."""

    def setup_method(self):
        import src.db

        src.db._driver = None

    def teardown_method(self):
        import src.db

        src.db._driver = None

    @patch("src.db.get_driver")
    def test_calls_verify_connectivity(self, mock_get_driver):
        from src.db import verify_connectivity

        mock_driver = MagicMock()
        mock_get_driver.return_value = mock_driver

        result = verify_connectivity()

        assert result is True
        mock_driver.verify_connectivity.assert_called_once()
