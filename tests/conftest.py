"""Shared pytest fixtures for Threat Oracle tests."""
import pytest
from unittest.mock import MagicMock

from api.main import create_app
from api.dependencies import get_neo4j_session, get_neo4j_driver


@pytest.fixture
def mock_neo4j_session():
    """Create a mock Neo4j session."""
    return MagicMock()


@pytest.fixture
def mock_neo4j_driver():
    """Create a mock Neo4j driver."""
    return MagicMock()


@pytest.fixture
def app(mock_neo4j_session, mock_neo4j_driver):
    """Create a FastAPI app with mocked Neo4j dependencies."""
    application = create_app()

    def override_session():
        yield mock_neo4j_session

    application.dependency_overrides[get_neo4j_session] = override_session
    application.dependency_overrides[get_neo4j_driver] = lambda: mock_neo4j_driver

    yield application

    application.dependency_overrides.clear()


@pytest.fixture
def client(app):
    """Create a FastAPI test client with mocked dependencies."""
    from fastapi.testclient import TestClient

    return TestClient(app)
