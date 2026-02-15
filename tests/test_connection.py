"""Phase 1: AuraDB connection tests."""
import os
import subprocess
import json
import pytest
from neo4j import GraphDatabase


def get_aura_creds():
    """Fetch AuraDB credentials from Bitwarden Secrets Manager."""
    token_cmd = "cat ~/.openclaw/openclaw.json | jq -r '.env.BWS_ACCESS_TOKEN'"
    token = subprocess.check_output(token_cmd, shell=True).decode().strip()
    
    env = os.environ.copy()
    env["BWS_ACCESS_TOKEN"] = token
    
    # Get URI
    result = subprocess.check_output(
        ["bws", "secret", "get", "1fb91baf-e4f8-493b-8bbc-b3f20051d3bb", "-o", "json"],
        env=env
    )
    uri = json.loads(result)["value"]
    
    # Get password
    result = subprocess.check_output(
        ["bws", "secret", "get", "e75daef7-2d2a-4ebf-aa93-b3f20051d400", "-o", "json"],
        env=env
    )
    password = json.loads(result)["value"]
    
    return uri, "neo4j", password


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


def test_empty_database(driver):
    """Verify the database starts empty (for POC)."""
    with driver.session() as session:
        result = session.run("MATCH (n) RETURN count(n) AS count")
        count = result.single()["count"]
        # Should be 0 or very small (only test artifacts)
        assert count < 10, f"Expected near-empty DB, got {count} nodes"
