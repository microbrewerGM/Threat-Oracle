"""Phase 2: ATT&CK STIX importer tests — TDD."""
import os
import pytest
from neo4j import GraphDatabase

from importers.attack_importer import parse_attack_stix, import_attack_to_neo4j


ATTACK_JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "enterprise-attack.json")
HAVE_DATA = os.path.exists(ATTACK_JSON_PATH)


def get_driver():
    uri = os.environ.get("NEO4J_URI")
    pw = os.environ.get("NEO4J_PASSWORD")
    if not uri or not pw:
        return None
    return GraphDatabase.driver(uri, auth=(os.environ.get("NEO4J_USERNAME", "neo4j"), pw))


HAVE_DB = os.environ.get("NEO4J_URI") is not None


@pytest.mark.skipif(not HAVE_DATA, reason="ATT&CK JSON not downloaded")
class TestATTACKParser:
    """Test ATT&CK STIX parsing without database."""

    @pytest.fixture(scope="class")
    def parsed(self):
        return parse_attack_stix(ATTACK_JSON_PATH)

    def test_parses_techniques(self, parsed):
        objects, _ = parsed
        techniques = [o for o in objects if o.obj_type == "Technique"]
        assert len(techniques) > 200, f"Expected 200+ techniques, got {len(techniques)}"

    def test_parses_tactics(self, parsed):
        objects, _ = parsed
        tactics = [o for o in objects if o.obj_type == "Tactic"]
        assert len(tactics) >= 14, f"Expected 14 tactics, got {len(tactics)}"

    def test_parses_relationships(self, parsed):
        _, rels = parsed
        assert len(rels) > 5000, f"Expected 5000+ relationships, got {len(rels)}"

    def test_technique_has_attack_id(self, parsed):
        objects, _ = parsed
        techniques = [o for o in objects if o.obj_type == "Technique"]
        for t in techniques[:20]:
            assert t.attack_id.startswith("T"), f"Bad attack_id: {t.attack_id}"

    def test_finds_known_technique(self, parsed):
        objects, _ = parsed
        ids = {o.attack_id for o in objects}
        assert "T1059" in ids, "T1059 (Command and Scripting Interpreter) not found"
        assert "T1078" in ids, "T1078 (Valid Accounts) not found"
        assert "T1055" in ids, "T1055 (Process Injection) not found"

    def test_technique_has_tactics(self, parsed):
        objects, _ = parsed
        t1059 = next((o for o in objects if o.attack_id == "T1059"), None)
        assert t1059 is not None
        assert len(t1059.tactics) > 0, "T1059 should have tactics"


@pytest.mark.neo4j
@pytest.mark.skipif(not HAVE_DB, reason="NEO4J env vars required")
@pytest.mark.skipif(not HAVE_DATA, reason="ATT&CK JSON not downloaded")
class TestATTACKImport:
    """Test ATT&CK import to Neo4j."""

    @pytest.fixture(scope="class")
    def driver(self):
        drv = get_driver()
        yield drv
        drv.close()

    @pytest.fixture(scope="class")
    def imported(self, driver):
        objects, rels = parse_attack_stix(ATTACK_JSON_PATH)
        nodes, edges = import_attack_to_neo4j(driver, objects, rels)
        yield {"nodes": nodes, "edges": edges}

    def test_techniques_created(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH (t:Technique) RETURN count(t) AS count")
            count = result.single()["count"]
            assert count > 200, f"Expected 200+ techniques, got {count}"

    def test_tactics_created(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH (t:Tactic) RETURN count(t) AS count")
            count = result.single()["count"]
            assert count >= 14, f"Expected 14+ tactics, got {count}"

    def test_mitigations_created(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH (m:Mitigation) RETURN count(m) AS count")
            count = result.single()["count"]
            assert count > 40, f"Expected 40+ mitigations, got {count}"

    def test_uses_relationships(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH ()-[r:USES]->() RETURN count(r) AS count")
            count = result.single()["count"]
            assert count > 1000, f"Expected 1000+ USES, got {count}"

    def test_mitigates_relationships(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH ()-[r:MITIGATES]->() RETURN count(r) AS count")
            count = result.single()["count"]
            assert count > 100, f"Expected 100+ MITIGATES, got {count}"

    def test_t1059_exists(self, driver, imported):
        with driver.session() as session:
            result = session.run(
                "MATCH (t:Technique {attack_id: 'T1059'}) RETURN t.name AS name"
            )
            record = result.single()
            assert record is not None, "T1059 not in graph"
            assert "Command" in record["name"]
