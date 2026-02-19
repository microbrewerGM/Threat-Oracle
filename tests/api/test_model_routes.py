"""Tests for threat model CRUD endpoints."""
from unittest.mock import MagicMock, patch


def _make_mock_record(data):
    """Create a mock Neo4j record with dict-like access."""
    record = MagicMock()
    record.__getitem__ = lambda self, key: data[key]
    return record


def _make_mock_result(records):
    """Create a mock Neo4j result that iterates over records."""
    result = MagicMock()
    if len(records) == 1:
        result.single.return_value = _make_mock_record(records[0])
    else:
        result.single.return_value = None
    result.__iter__ = lambda self: iter([_make_mock_record(r) for r in records])
    return result


# --- Create model ---


def test_create_model(client, mock_neo4j_session):
    """POST /api/v1/models creates a new threat model."""
    mock_neo4j_session.run.return_value = _make_mock_result([
        {
            "m": {"model_id": "model-abc123", "name": "Test Model", "description": "A test", "version": "0.1.0"},
            "model_id": "model-abc123",
        }
    ])

    response = client.post("/api/v1/models", json={"name": "Test Model", "description": "A test"})

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Model"
    assert data["model_id"] == "model-abc123"
    mock_neo4j_session.run.assert_called_once()


# --- List models ---


def test_list_models(client, mock_neo4j_session):
    """GET /api/v1/models returns list of models."""
    mock_neo4j_session.run.return_value = _make_mock_result([
        {"m": {"model_id": "model-1", "name": "Model 1"}},
        {"m": {"model_id": "model-2", "name": "Model 2"}},
    ])

    response = client.get("/api/v1/models")

    assert response.status_code == 200
    data = response.json()
    assert len(data["models"]) == 2
    assert data["models"][0]["name"] == "Model 1"


# --- Get model ---


def test_get_model(client, mock_neo4j_session):
    """GET /api/v1/models/{id} returns model with assets."""
    mock_neo4j_session.run.return_value = _make_mock_result([
        {
            "m": {"model_id": "model-1", "name": "Model 1"},
            "technical_assets": [{"asset_id": "ta-1", "name": "Web Server"}],
            "trust_boundaries": [],
            "data_flows": [],
            "data_assets": [],
        }
    ])

    response = client.get("/api/v1/models/model-1")

    assert response.status_code == 200
    data = response.json()
    assert data["model"]["name"] == "Model 1"
    assert len(data["technical_assets"]) == 1


def test_get_model_not_found(client, mock_neo4j_session):
    """GET /api/v1/models/{id} returns 404 for missing model."""
    mock_result = MagicMock()
    mock_result.single.return_value = None
    mock_neo4j_session.run.return_value = mock_result

    response = client.get("/api/v1/models/nonexistent")

    assert response.status_code == 404


# --- Update model ---


def test_update_model(client, mock_neo4j_session):
    """PUT /api/v1/models/{id} updates model properties."""
    mock_neo4j_session.run.return_value = _make_mock_result([
        {"m": {"model_id": "model-1", "name": "Updated Name", "version": "0.2.0"}}
    ])

    response = client.put("/api/v1/models/model-1", json={"name": "Updated Name"})

    assert response.status_code == 200
    assert response.json()["name"] == "Updated Name"


def test_update_model_no_valid_fields(client, mock_neo4j_session):
    """PUT /api/v1/models/{id} returns 400 if no valid fields provided."""
    response = client.put("/api/v1/models/model-1", json={"invalid_field": "value"})

    assert response.status_code == 400


# --- Delete model ---


def test_delete_model(client, mock_neo4j_session):
    """DELETE /api/v1/models/{id} deletes model and children."""
    mock_neo4j_session.run.return_value = _make_mock_result([{"deleted": 1}])

    response = client.delete("/api/v1/models/model-1")

    assert response.status_code == 200
    assert response.json()["status"] == "deleted"


def test_delete_model_not_found(client, mock_neo4j_session):
    """DELETE /api/v1/models/{id} returns 404 for missing model."""
    mock_neo4j_session.run.return_value = _make_mock_result([{"deleted": 0}])

    response = client.delete("/api/v1/models/nonexistent")

    assert response.status_code == 404


# --- Technical asset CRUD ---


def test_add_technical_asset(client, mock_neo4j_session):
    """POST /api/v1/models/{id}/assets creates a technical asset."""
    mock_neo4j_session.run.return_value = _make_mock_result([
        {"ta": {"asset_id": "ta-abc", "name": "API Server", "type": "process"}}
    ])

    response = client.post(
        "/api/v1/models/model-1/assets",
        json={"name": "API Server", "type": "process"},
    )

    assert response.status_code == 200
    assert response.json()["name"] == "API Server"


def test_delete_technical_asset(client, mock_neo4j_session):
    """DELETE /api/v1/models/{id}/assets/{asset_id} removes the asset."""
    mock_neo4j_session.run.return_value = _make_mock_result([{"deleted": 1}])

    response = client.delete("/api/v1/models/model-1/assets/ta-abc")

    assert response.status_code == 200
    assert response.json()["status"] == "deleted"
