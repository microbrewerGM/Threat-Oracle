"""Phase 2: CWE importer tests — TDD."""
import os
import pytest
from neo4j import GraphDatabase

from importers.cwe_importer import parse_cwe_xml, import_cwe_to_neo4j, CWEWeakness


# --- Parsing tests (no DB needed) ---

CWE_XML_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "cwec_v4.19.1.xml")
HAVE_DATA = os.path.exists(CWE_XML_PATH)


@pytest.mark.skipif(not HAVE_DATA, reason="CWE XML not downloaded")
class TestCWEParser:
    """Test CWE XML parsing without database."""

    @pytest.fixture(scope="class")
    def weaknesses(self):
        return parse_cwe_xml(CWE_XML_PATH)

    def test_parses_weaknesses(self, weaknesses):
        """Should parse hundreds of CWE entries."""
        assert len(weaknesses) > 900, f"Expected 900+ weaknesses, got {len(weaknesses)}"

    def test_weakness_has_required_fields(self, weaknesses):
        """Each weakness should have id, name, description."""
        for w in weaknesses[:10]:
            assert w.cwe_id, "Missing CWE ID"
            assert w.name, f"CWE-{w.cwe_id} missing name"
            assert w.description, f"CWE-{w.cwe_id} missing description"
            assert w.abstraction in ("Pillar", "Class", "Base", "Variant", "Compound"), \
                f"CWE-{w.cwe_id} unexpected abstraction: {w.abstraction}"

    def test_finds_known_cwe(self, weaknesses):
        """Should find well-known CWEs like SQL Injection (89)."""
        ids = {w.cwe_id for w in weaknesses}
        assert "89" in ids, "CWE-89 (SQL Injection) not found"
        assert "79" in ids, "CWE-79 (XSS) not found"
        assert "287" in ids, "CWE-287 (Improper Auth) not found"

    def test_has_relationships(self, weaknesses):
        """At least some weaknesses should have related weaknesses."""
        with_rels = [w for w in weaknesses if w.related]
        assert len(with_rels) > 100, f"Expected 100+ with relationships, got {len(with_rels)}"

    def test_sql_injection_details(self, weaknesses):
        """CWE-89 should have known properties."""
        cwe89 = next((w for w in weaknesses if w.cwe_id == "89"), None)
        assert cwe89 is not None
        assert "SQL" in cwe89.name
        assert cwe89.abstraction == "Base"
        # Should be child of CWE-943 (Improper Neutralization of Special Elements in Data Query Logic)
        child_of = [t for n, t in cwe89.related if n == "ChildOf"]
        assert len(child_of) > 0, "CWE-89 should have ChildOf relationships"


# --- Import tests (need DB) ---

def get_driver():
    uri = os.environ.get("NEO4J_URI")
    pw = os.environ.get("NEO4J_PASSWORD")
    if not uri or not pw:
        return None
    return GraphDatabase.driver(uri, auth=(os.environ.get("NEO4J_USERNAME", "neo4j"), pw))


HAVE_DB = os.environ.get("NEO4J_URI") is not None


@pytest.mark.skipif(not HAVE_DB, reason="NEO4J env vars required")
@pytest.mark.skipif(not HAVE_DATA, reason="CWE XML not downloaded")
class TestCWEImport:
    """Test CWE import to Neo4j — integration tests."""

    @pytest.fixture(scope="class")
    def driver(self):
        drv = get_driver()
        yield drv
        drv.close()

    @pytest.fixture(scope="class")
    def imported(self, driver):
        """Import CWE data once for all tests in this class."""
        weaknesses = parse_cwe_xml(CWE_XML_PATH)
        nodes, edges = import_cwe_to_neo4j(driver, weaknesses)
        yield {"nodes": nodes, "edges": edges, "weaknesses": weaknesses}

    def test_import_creates_nodes(self, driver, imported):
        """Should create CWE nodes in the graph."""
        with driver.session() as session:
            result = session.run("MATCH (c:CWE) RETURN count(c) AS count")
            count = result.single()["count"]
            assert count >= 900, f"Expected 900+ CWE nodes, got {count}"

    def test_import_creates_relationships(self, driver, imported):
        """Should create relationships between CWE nodes."""
        with driver.session() as session:
            result = session.run("MATCH ()-[r:CHILD_OF]->() RETURN count(r) AS count")
            count = result.single()["count"]
            assert count > 500, f"Expected 500+ CHILD_OF relationships, got {count}"

    def test_cwe89_exists(self, driver, imported):
        """CWE-89 should exist with correct properties."""
        with driver.session() as session:
            result = session.run(
                "MATCH (c:CWE {cwe_id: 'CWE-89'}) RETURN c.name AS name, c.abstraction AS abs"
            )
            record = result.single()
            assert record is not None, "CWE-89 not found in graph"
            assert "SQL" in record["name"]
            assert record["abs"] == "Base"

    def test_cwe89_has_parent(self, driver, imported):
        """CWE-89 should have a CHILD_OF relationship."""
        with driver.session() as session:
            result = session.run(
                "MATCH (c:CWE {cwe_id: 'CWE-89'})-[:CHILD_OF]->(parent:CWE) RETURN parent.cwe_id AS pid"
            )
            parents = [r["pid"] for r in result]
            assert len(parents) > 0, "CWE-89 should have at least one parent"

    def test_idempotent_reimport(self, driver, imported):
        """Importing again should not duplicate nodes."""
        with driver.session() as session:
            result = session.run("MATCH (c:CWE) RETURN count(c) AS count")
            before = result.single()["count"]

        weaknesses = parse_cwe_xml(CWE_XML_PATH)
        import_cwe_to_neo4j(driver, weaknesses)

        with driver.session() as session:
            result = session.run("MATCH (c:CWE) RETURN count(c) AS count")
            after = result.single()["count"]

        assert before == after, f"Re-import created duplicates: {before} → {after}"
