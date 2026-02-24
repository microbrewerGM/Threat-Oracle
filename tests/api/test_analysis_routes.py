"""Tests for analysis API endpoints."""
from unittest.mock import MagicMock, patch

from analysis.llm.schemas import AnalysisJobStatus, AnalysisTier


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


MODEL_DATA_RECORD = {
    "m": {
        "model_id": "model-1",
        "name": "Test Model",
        "repo_url": "https://github.com/test/repo",
    },
    "technical_assets": [{"asset_id": "ta-1", "name": "Web Server"}],
    "trust_boundaries": [],
    "data_flows": [],
    "data_assets": [],
}


# --- Trigger analysis ---


@patch("api.routes.analysis.start_analysis", return_value="job-abc123")
def test_trigger_analysis_success(mock_start, client, mock_neo4j_session):
    """POST with tier_1 and a Groq key header returns 200 with job_id."""
    mock_neo4j_session.run.return_value = _make_mock_result([MODEL_DATA_RECORD])

    response = client.post(
        "/api/v1/models/model-1/analyze",
        json={"tier": "tier_1"},
        headers={"X-Groq-Api-Key": "gsk_test123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == "job-abc123"
    assert data["model_id"] == "model-1"
    assert data["status"] == "pending"
    mock_start.assert_called_once()


@patch("api.routes.analysis.start_analysis", return_value="job-tier0")
def test_trigger_analysis_tier0_no_keys(mock_start, client, mock_neo4j_session):
    """POST with tier_0 and no keys returns 200 (tier_0 doesn't need keys)."""
    mock_neo4j_session.run.return_value = _make_mock_result([MODEL_DATA_RECORD])

    response = client.post(
        "/api/v1/models/model-1/analyze",
        json={"tier": "tier_0"},
    )

    assert response.status_code == 200
    assert response.json()["job_id"] == "job-tier0"


def test_trigger_analysis_tier1_no_keys(client, mock_neo4j_session):
    """POST with tier_1 and no keys returns 400 error."""
    mock_neo4j_session.run.return_value = _make_mock_result([MODEL_DATA_RECORD])

    response = client.post(
        "/api/v1/models/model-1/analyze",
        json={"tier": "tier_1"},
    )

    assert response.status_code == 400
    assert "API key" in response.json()["detail"]


def test_trigger_analysis_model_not_found(client, mock_neo4j_session):
    """POST with unknown model_id returns 404."""
    mock_result = MagicMock()
    mock_result.single.return_value = None
    mock_neo4j_session.run.return_value = mock_result

    response = client.post(
        "/api/v1/models/nonexistent/analyze",
        json={"tier": "tier_0"},
    )

    assert response.status_code == 404


# --- Analysis status ---


@patch("api.routes.analysis.get_job_status")
def test_get_analysis_status_success(mock_status, client):
    """GET with valid job_id returns status."""
    mock_status.return_value = AnalysisJobStatus(
        job_id="job-abc",
        model_id="model-1",
        tier=AnalysisTier.TIER_1,
        status="running",
        progress_pct=50,
        current_phase=2,
        units_completed=3,
        units_total=6,
        threats_found=2,
    )

    response = client.get("/api/v1/models/model-1/analyze/job-abc")

    assert response.status_code == 200
    data = response.json()
    assert data["job_id"] == "job-abc"
    assert data["status"] == "running"
    assert data["progress_pct"] == 50
    assert data["threats_found"] == 2


@patch("api.routes.analysis.get_job_status", return_value=None)
def test_get_analysis_status_not_found(mock_status, client):
    """GET with unknown job_id returns 404."""
    response = client.get("/api/v1/models/model-1/analyze/nonexistent")

    assert response.status_code == 404


@patch("api.routes.analysis.get_job_status")
def test_get_analysis_status_wrong_model(mock_status, client):
    """GET with valid job but wrong model_id returns 404."""
    mock_status.return_value = AnalysisJobStatus(
        job_id="job-abc",
        model_id="model-OTHER",
        tier=AnalysisTier.TIER_1,
        status="running",
    )

    response = client.get("/api/v1/models/model-1/analyze/job-abc")

    assert response.status_code == 404


# --- List threats ---


def test_list_threats_empty(client, mock_neo4j_session):
    """GET threats for model with no threats returns empty list."""
    mock_result = MagicMock()
    mock_result.__iter__ = lambda self: iter([])
    mock_neo4j_session.run.return_value = mock_result

    response = client.get("/api/v1/models/model-1/threats")

    assert response.status_code == 200
    data = response.json()
    assert data["threats"] == []
    assert data["total"] == 0
    assert data["model_id"] == "model-1"


def test_list_threats_returns_ordered(client, mock_neo4j_session):
    """GET threats returns list of threats."""
    threat1 = {
        "threat_id": "t-1",
        "title": "SQL Injection",
        "stride_category": "tampering",
        "severity": "critical",
        "likelihood": "likely",
        "risk_score": 9.0,
        "attack_vector": "network",
        "description": "SQL injection in login",
        "remediation": "Use parameterized queries",
        "confidence": 0.9,
        "cwe_ids": ["CWE-89"],
        "capec_ids": [],
        "attack_technique_ids": [],
        "affected_assets": ["web-app"],
        "analysis_tier": "tier_1",
        "job_id": "job-1",
    }
    threat2 = {
        "threat_id": "t-2",
        "title": "XSS",
        "stride_category": "tampering",
        "severity": "high",
        "risk_score": 7.0,
        "confidence": 0.8,
    }

    records = [
        _make_mock_record({"t": threat1}),
        _make_mock_record({"t": threat2}),
    ]
    mock_result = MagicMock()
    mock_result.__iter__ = lambda self: iter(records)
    mock_neo4j_session.run.return_value = mock_result

    response = client.get("/api/v1/models/model-1/threats")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["threats"][0]["threat_id"] == "t-1"
    assert data["threats"][0]["risk_score"] == 9.0
    assert data["threats"][1]["threat_id"] == "t-2"


# --- BYOK headers ---


@patch("api.routes.analysis.start_analysis", return_value="job-byok")
def test_byok_headers_forwarded(mock_start, client, mock_neo4j_session):
    """Verify X-Groq-Api-Key header arrives in LLMProviderKeys."""
    mock_neo4j_session.run.return_value = _make_mock_result([MODEL_DATA_RECORD])

    response = client.post(
        "/api/v1/models/model-1/analyze",
        json={"tier": "tier_1"},
        headers={"X-Groq-Api-Key": "gsk_testkey"},
    )

    assert response.status_code == 200
    # Verify the keys were passed to start_analysis
    call_args = mock_start.call_args
    keys = call_args[0][2]  # third positional arg is keys
    assert keys.groq_api_key == "gsk_testkey"
    assert keys.anthropic_api_key is None
