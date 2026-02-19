"""Tests for health check endpoints."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock

from api.main import create_app
from api.dependencies import get_neo4j_driver


@pytest.fixture
def client():
    """Create a test client that doesn't require Neo4j."""
    app = create_app()
    return TestClient(app)


def test_health_check(client):
    """GET /health returns ok without requiring database."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_db_health_connected():
    """GET /health/db returns connected when Neo4j is available."""
    app = create_app()
    mock_driver = MagicMock()
    app.dependency_overrides[get_neo4j_driver] = lambda: mock_driver

    client = TestClient(app)
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"

    app.dependency_overrides.clear()


def test_db_health_disconnected():
    """GET /health/db returns degraded when Neo4j is unavailable."""
    app = create_app()
    mock_driver = MagicMock()
    mock_driver.verify_connectivity.side_effect = Exception("Connection refused")
    app.dependency_overrides[get_neo4j_driver] = lambda: mock_driver

    client = TestClient(app)
    response = client.get("/health/db")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "degraded"
    assert data["database"] == "disconnected"

    app.dependency_overrides.clear()
