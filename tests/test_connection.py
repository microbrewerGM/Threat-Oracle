"""Phase 1: AuraDB connection tests."""
import os
import pytest
from neo4j import GraphDatabase

pytestmark = pytest.mark.neo4j


def get_aura_creds():
    """Get AuraDB credentials from environment variables."""
    uri = os.environ.get("NEO4J_URI")
    user = os.environ.get("NEO4J_USERNAME", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD")
    
    if not uri or not password:
        pytest.skip("NEO4J_URI and NEO4J_PASSWORD env vars required")
    
    return uri, user, password


@pytest.fixture(scope="module")
def driver():
    """Create a Neo4j driver connected to AuraDB."""
    uri, user, password = get_aura_creds()
    drv = GraphDatabase.driver(uri, auth=(user, password))
    yield drv
    drv.close()


def test_connectivity(driver):
    """Verify we can connect to AuraDB."""
    driver.verify_connectivity()


def test_cypher_query(driver):
    """Verify we can run Cypher queries."""
    with driver.session() as session:
        result = session.run("RETURN 1 AS num")
        assert result.single()["num"] == 1


def test_create_and_delete_node(driver):
    """Verify we can create and delete nodes (write access)."""
    with driver.session() as session:
        # Create
        session.run("CREATE (t:Test {name: 'connection_test', ts: datetime()})")
        result = session.run("MATCH (t:Test {name: 'connection_test'}) RETURN count(t) AS c")
        assert result.single()["c"] >= 1
        
        # Cleanup
        session.run("MATCH (t:Test {name: 'connection_test'}) DELETE t")
        result = session.run("MATCH (t:Test {name: 'connection_test'}) RETURN count(t) AS c")
        assert result.single()["c"] == 0


def test_database_accessible(driver):
    """Verify we can count nodes (smoke test)."""
    with driver.session() as session:
        result = session.run("MATCH (n) RETURN count(n) AS count")
        count = result.single()["count"]
        assert count >= 0, "Node count should be non-negative"
