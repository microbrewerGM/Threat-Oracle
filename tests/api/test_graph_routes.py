"""Tests for graph query endpoints using mocked Neo4j sessions."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from api.main import create_app
from api.dependencies import get_neo4j_session


def make_mock_session():
    """Create a mock Neo4j session with chainable run() results."""
    session = MagicMock()
    return session


def make_mock_record(props, labels=None):
    """Create a mock Neo4j record."""
    record = MagicMock()
    node = MagicMock()
    node.__iter__ = MagicMock(return_value=iter(props.items()))
    node.__getitem__ = lambda self, key: props[key]
    # Make dict(node) work
    node.keys = MagicMock(return_value=props.keys())
    node.values = MagicMock(return_value=props.values())
    node.items = MagicMock(return_value=props.items())

    record.__getitem__ = lambda self, key: {
        "n": node,
        "labels": labels or ["CWE"],
    }[key]
    return record


@pytest.fixture
def client():
    """Create a test client with mocked Neo4j session."""
    app = create_app()

    mock_session = make_mock_session()

    def override_session():
        yield mock_session

    app.dependency_overrides[get_neo4j_session] = override_session
    return TestClient(app), mock_session


def test_graph_stats(client):
    """GET /api/v1/graph/stats returns node and relationship counts."""
    test_client, mock_session = client

    # Call sequence: labels query, then count per label, then total rels, then rel types, then count per type
    mock_session.run.side_effect = [
        # 1: CALL db.labels() — iterable of records
        [{"label": "CWE"}, {"label": "Technique"}],
        # 2: MATCH (n:`CWE`) RETURN count(n)
        MagicMock(single=MagicMock(return_value={"count": 969})),
        # 3: MATCH (n:`Technique`) RETURN count(n)
        MagicMock(single=MagicMock(return_value={"count": 800})),
        # 4: MATCH ()-[r]->() RETURN count(r) — total relationships
        MagicMock(single=MagicMock(return_value={"count": 5000})),
        # 5: CALL db.relationshipTypes()
        [{"relationshipType": "CHILD_OF"}],
        # 6: MATCH ()-[r:`CHILD_OF`]->() RETURN count(r)
        MagicMock(single=MagicMock(return_value={"count": 1443})),
    ]

    response = test_client.get("/api/v1/graph/stats")
    assert response.status_code == 200
    data = response.json()
    assert "node_counts" in data
    assert data["node_counts"]["CWE"] == 969
    assert data["total_relationships"] == 5000


def test_list_nodes_no_filter(client):
    """GET /api/v1/graph/nodes returns nodes."""
    test_client, mock_session = client

    mock_result = MagicMock()
    mock_result.__iter__ = MagicMock(return_value=iter([]))
    mock_session.run.return_value = mock_result

    response = test_client.get("/api/v1/graph/nodes")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert data["skip"] == 0
    assert data["limit"] == 25


def test_list_nodes_with_label_filter(client):
    """GET /api/v1/graph/nodes?label=CWE filters by label."""
    test_client, mock_session = client

    mock_result = MagicMock()
    mock_result.__iter__ = MagicMock(return_value=iter([]))
    mock_session.run.return_value = mock_result

    response = test_client.get("/api/v1/graph/nodes?label=CWE&limit=10")
    assert response.status_code == 200

    # Verify the query used the label filter
    call_args = mock_session.run.call_args
    assert "CWE" in call_args[0][0]


def test_search_graph(client):
    """GET /api/v1/graph/search?q=injection searches nodes."""
    test_client, mock_session = client

    mock_result = MagicMock()
    mock_result.__iter__ = MagicMock(return_value=iter([]))
    mock_session.run.return_value = mock_result

    response = test_client.get("/api/v1/graph/search?q=injection")
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "injection"
    assert "results" in data


def test_search_requires_query(client):
    """GET /api/v1/graph/search without q parameter returns 422."""
    test_client, _ = client

    response = test_client.get("/api/v1/graph/search")
    assert response.status_code == 422
