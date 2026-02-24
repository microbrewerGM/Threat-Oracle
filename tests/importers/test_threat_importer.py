"""Tests for threat_importer — unit tests with mock Neo4j driver."""
from unittest.mock import MagicMock, call

from importers.threat_importer import ThreatNode, threats_from_findings, import_threats_to_neo4j


# --- threats_from_findings tests ---


def test_threats_from_findings_basic():
    """Convert a valid finding dict list, check threat_id format."""
    findings = [
        {
            "title": "SQL Injection in login",
            "stride_category": "tampering",
            "severity": "high",
            "description": "User input not sanitized",
            "cwe_ids": ["CWE-89"],
        },
        {
            "title": "Broken auth",
            "stride_category": "spoofing",
            "severity": "critical",
        },
    ]
    threats = threats_from_findings(findings, "abc123")
    assert len(threats) == 2
    assert threats[0].threat_id == "threat-abc123-0"
    assert threats[1].threat_id == "threat-abc123-1"
    assert threats[0].title == "SQL Injection in login"
    assert threats[0].stride_category == "tampering"
    assert threats[0].severity == "high"
    assert threats[0].cwe_ids == ["CWE-89"]


def test_threats_from_findings_empty():
    """Empty input returns empty list."""
    assert threats_from_findings([], "job1") == []


def test_threats_from_findings_truncation():
    """Long description gets truncated to 5000 chars."""
    findings = [{"title": "T", "description": "x" * 10000}]
    threats = threats_from_findings(findings, "j1")
    assert len(threats[0].description) == 5000


def test_threats_from_findings_defaults():
    """Missing fields get sensible defaults."""
    findings = [{}]
    threats = threats_from_findings(findings, "j2")
    t = threats[0]
    assert t.title == "Unknown Threat"
    assert t.stride_category == "information_disclosure"
    assert t.severity == "medium"
    assert t.likelihood == "possible"
    assert t.risk_score == 5.0
    assert t.confidence == 0.5
    assert t.cwe_ids == []
    assert t.capec_ids == []
    assert t.attack_technique_ids == []
    assert t.affected_assets == []
    assert t.analysis_tier == "tier_1"


# --- ThreatNode dataclass ---


def test_threat_node_dataclass():
    """ThreatNode creation with all fields."""
    t = ThreatNode(
        threat_id="threat-aaa-0",
        title="Test Threat",
        stride_category="tampering",
        severity="high",
        description="A test threat",
        likelihood="likely",
        risk_score=7.5,
        attack_vector="Network-based",
        remediation="Apply input validation",
        confidence=0.9,
        cwe_ids=["CWE-89", "CWE-79"],
        capec_ids=["CAPEC-66"],
        attack_technique_ids=["T1190"],
        affected_assets=["web-server"],
        analysis_tier="tier_2",
        job_id="aaa",
    )
    assert t.threat_id == "threat-aaa-0"
    assert t.risk_score == 7.5
    assert t.cwe_ids == ["CWE-89", "CWE-79"]
    assert t.analysis_tier == "tier_2"


# --- import_threats_to_neo4j tests ---


def _mock_driver():
    """Create a mock Neo4j driver with session context manager."""
    driver = MagicMock()
    session = MagicMock()
    driver.session.return_value.__enter__ = MagicMock(return_value=session)
    driver.session.return_value.__exit__ = MagicMock(return_value=False)

    # Default: session.run returns a result with single()["cnt"] = 1
    result_mock = MagicMock()
    result_mock.single.return_value = {"cnt": 1}
    session.run.return_value = result_mock

    return driver, session


def test_import_threats_empty_list():
    """Empty list returns (0, 0) immediately."""
    driver = MagicMock()
    nodes, rels = import_threats_to_neo4j(driver, [], "model-1")
    assert (nodes, rels) == (0, 0)
    driver.session.assert_not_called()


def test_import_threats_creates_nodes():
    """Mock driver — verify MERGE query called with correct params."""
    driver, session = _mock_driver()
    threats = [
        ThreatNode(
            threat_id="threat-abc-0",
            title="Test",
            stride_category="tampering",
            severity="high",
            job_id="abc",
        )
    ]
    nodes, rels = import_threats_to_neo4j(driver, threats, "model-1")
    assert nodes == 1
    # Phase 1 query should have been called
    assert session.run.call_count >= 1
    first_call = session.run.call_args_list[0]
    query = first_call[0][0]
    assert "MERGE (t:Threat {threat_id: n.threat_id})" in query
    assert "MERGE (m)-[:HAS_THREAT]->(t)" in query
    assert first_call[1]["model_id"] == "model-1"


def test_import_threats_idempotent():
    """Calling twice with same data uses MERGE (not CREATE) — verified by query text."""
    driver, session = _mock_driver()
    threats = [
        ThreatNode(
            threat_id="threat-abc-0",
            title="Test",
            stride_category="tampering",
            severity="high",
        )
    ]
    import_threats_to_neo4j(driver, threats, "model-1")
    import_threats_to_neo4j(driver, threats, "model-1")
    # All queries should use MERGE, never CREATE
    for c in session.run.call_args_list:
        query = c[0][0]
        assert "CREATE" not in query, f"Found CREATE in query: {query}"
        assert "MERGE" in query


def test_cwe_edge_creation():
    """Verify CWE edges query is called when cwe_ids present."""
    driver, session = _mock_driver()
    threats = [
        ThreatNode(
            threat_id="threat-abc-0",
            title="Test",
            stride_category="tampering",
            severity="high",
            cwe_ids=["CWE-89", "CWE-79"],
        )
    ]
    import_threats_to_neo4j(driver, threats, "model-1")
    # Should have at least 2 calls: phase 1 (nodes) + phase 2 (CWE edges)
    assert session.run.call_count >= 2
    cwe_query_found = False
    for c in session.run.call_args_list:
        query = c[0][0]
        if "EXPLOITS" in query:
            cwe_query_found = True
            assert "MERGE (t)-[:EXPLOITS]->(c)" in query
            edges = c[1]["edges"]
            assert len(edges) == 2
            assert edges[0]["cwe_id"] == "CWE-89"
    assert cwe_query_found, "CWE EXPLOITS query not found"


def test_no_cwe_edges_when_empty():
    """Verify no CWE query when cwe_ids is empty."""
    driver, session = _mock_driver()
    threats = [
        ThreatNode(
            threat_id="threat-abc-0",
            title="Test",
            stride_category="tampering",
            severity="high",
            cwe_ids=[],
        )
    ]
    import_threats_to_neo4j(driver, threats, "model-1")
    for c in session.run.call_args_list:
        query = c[0][0]
        assert "EXPLOITS" not in query, "CWE query should not be called with empty cwe_ids"
