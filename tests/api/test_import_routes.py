"""Tests for import trigger endpoints."""
import pytest
from unittest.mock import patch, MagicMock


# -- CWE import ---------------------------------------------------------------


def test_trigger_cwe_import(client, mock_neo4j_driver):
    """POST /api/v1/import/trigger/cwe runs CWE import pipeline."""
    mock_weaknesses = [{"id": "CWE-79"}, {"id": "CWE-89"}]

    with (
        patch("api.routes.imports.os.path.exists", return_value=True),
        patch(
            "importers.cwe_importer.parse_cwe_xml", return_value=mock_weaknesses
        ) as mock_parse,
        patch(
            "importers.cwe_importer.import_cwe_to_neo4j", return_value=(969, 1443)
        ) as mock_import,
    ):
        response = client.post("/api/v1/import/trigger/cwe")

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "cwe"
    assert data["status"] == "completed"
    assert data["nodes_imported"] == 969
    assert data["relationships_imported"] == 1443
    mock_parse.assert_called_once()
    mock_import.assert_called_once_with(mock_neo4j_driver, mock_weaknesses)


def test_trigger_cwe_import_file_not_found(client):
    """POST /api/v1/import/trigger/cwe returns 404 when data file missing."""
    with patch("api.routes.imports.os.path.exists", return_value=False):
        response = client.post("/api/v1/import/trigger/cwe")

    assert response.status_code == 404
    assert "CWE XML file not found" in response.json()["detail"]


# -- ATT&CK import ------------------------------------------------------------


def test_trigger_attack_import(client, mock_neo4j_driver):
    """POST /api/v1/import/trigger/attack runs ATT&CK import pipeline."""
    mock_objects = [{"type": "attack-pattern", "id": "T1059"}]
    mock_relationships = [{"type": "relationship"}]

    with (
        patch("api.routes.imports.os.path.exists", return_value=True),
        patch(
            "importers.attack_importer.parse_attack_stix",
            return_value=(mock_objects, mock_relationships),
        ) as mock_parse,
        patch(
            "importers.attack_importer.import_attack_to_neo4j",
            return_value=(2290, 19000),
        ) as mock_import,
    ):
        response = client.post("/api/v1/import/trigger/attack")

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "attack"
    assert data["status"] == "completed"
    assert data["nodes_imported"] == 2290
    assert data["relationships_imported"] == 19000
    mock_parse.assert_called_once()
    mock_import.assert_called_once_with(
        mock_neo4j_driver, mock_objects, mock_relationships
    )


def test_trigger_attack_import_file_not_found(client):
    """POST /api/v1/import/trigger/attack returns 404 when data file missing."""
    with patch("api.routes.imports.os.path.exists", return_value=False):
        response = client.post("/api/v1/import/trigger/attack")

    assert response.status_code == 404
    assert "ATT&CK JSON file not found" in response.json()["detail"]


# -- CAPEC import --------------------------------------------------------------


def test_trigger_capec_import(client, mock_neo4j_driver):
    """POST /api/v1/import/trigger/capec runs CAPEC import pipeline."""
    mock_patterns = [{"id": "CAPEC-1"}, {"id": "CAPEC-2"}]

    with (
        patch("api.routes.imports.os.path.exists", return_value=True),
        patch(
            "importers.capec_importer.parse_capec_xml", return_value=mock_patterns
        ) as mock_parse,
        patch(
            "importers.capec_importer.import_capec_to_neo4j",
            return_value=(559, 1200, 800),
        ) as mock_import,
    ):
        response = client.post("/api/v1/import/trigger/capec")

    assert response.status_code == 200
    data = response.json()
    assert data["source"] == "capec"
    assert data["status"] == "completed"
    assert data["nodes_imported"] == 559
    assert data["cwe_relationships"] == 1200
    assert data["attack_relationships"] == 800
    mock_parse.assert_called_once()
    mock_import.assert_called_once_with(mock_neo4j_driver, mock_patterns)


def test_trigger_capec_import_file_not_found(client):
    """POST /api/v1/import/trigger/capec returns 404 when data file missing."""
    with patch("api.routes.imports.os.path.exists", return_value=False):
        response = client.post("/api/v1/import/trigger/capec")

    assert response.status_code == 404
    assert "CAPEC XML file not found" in response.json()["detail"]


# -- Invalid source ------------------------------------------------------------


def test_trigger_import_invalid_source(client):
    """POST /api/v1/import/trigger/invalid returns 422 validation error."""
    response = client.post("/api/v1/import/trigger/invalid")
    assert response.status_code == 422
