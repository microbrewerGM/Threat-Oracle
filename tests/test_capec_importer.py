"""Phase 2: CAPEC importer tests — bridges CWE to ATT&CK."""
import os
import pytest
from neo4j import GraphDatabase

from importers.capec_importer import parse_capec_xml, import_capec_to_neo4j


CAPEC_XML_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "capec_latest.xml")
HAVE_DATA = os.path.exists(CAPEC_XML_PATH)
HAVE_DB = os.environ.get("NEO4J_URI") is not None


def get_driver():
    uri = os.environ.get("NEO4J_URI")
    pw = os.environ.get("NEO4J_PASSWORD")
    if not uri or not pw:
        return None
    return GraphDatabase.driver(uri, auth=(os.environ.get("NEO4J_USERNAME", "neo4j"), pw))


@pytest.mark.skipif(not HAVE_DATA, reason="CAPEC XML not downloaded")
class TestCAPECParser:
    @pytest.fixture(scope="class")
    def patterns(self):
        return parse_capec_xml(CAPEC_XML_PATH)

    def test_parses_patterns(self, patterns):
        assert len(patterns) > 500, f"Expected 500+ patterns, got {len(patterns)}"

    def test_has_cwe_links(self, patterns):
        with_cwes = [p for p in patterns if p.related_cwes]
        assert len(with_cwes) > 200, f"Expected 200+ with CWE links"

    def test_has_attack_links(self, patterns):
        with_attacks = [p for p in patterns if p.related_attacks]
        assert len(with_attacks) > 100, f"Expected 100+ with ATT&CK links"

    def test_attack_ids_formatted(self, patterns):
        for p in patterns:
            for aid in p.related_attacks:
                assert aid.startswith("T"), f"Bad attack ID: {aid}"


@pytest.mark.neo4j
@pytest.mark.skipif(not HAVE_DB, reason="NEO4J env vars required")
@pytest.mark.skipif(not HAVE_DATA, reason="CAPEC XML not downloaded")
class TestCAPECImport:
    @pytest.fixture(scope="class")
    def driver(self):
        drv = get_driver()
        yield drv
        drv.close()

    @pytest.fixture(scope="class")
    def imported(self, driver):
        patterns = parse_capec_xml(CAPEC_XML_PATH)
        return import_capec_to_neo4j(driver, patterns)

    def test_capec_nodes_created(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH (c:CAPEC) RETURN count(c) AS count")
            assert result.single()["count"] > 500

    def test_exploits_weakness_edges(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH ()-[r:EXPLOITS_WEAKNESS]->() RETURN count(r) AS count")
            assert result.single()["count"] > 500

    def test_maps_to_technique_edges(self, driver, imported):
        with driver.session() as session:
            result = session.run("MATCH ()-[r:MAPS_TO_TECHNIQUE]->() RETURN count(r) AS count")
            assert result.single()["count"] > 100

    def test_full_chain_cwe_to_attack(self, driver, imported):
        """The key test: CWE → CAPEC → ATT&CK path exists."""
        with driver.session() as session:
            result = session.run("""
                MATCH (w:CWE)<-[:EXPLOITS_WEAKNESS]-(c:CAPEC)-[:MAPS_TO_TECHNIQUE]->(t:Technique)
                RETURN count(DISTINCT t) AS techniques
            """)
            count = result.single()["techniques"]
            assert count > 50, f"Expected 50+ techniques reachable from CWE via CAPEC, got {count}"

    def test_end_to_end_chain(self, driver, imported):
        """At least some CWE→CAPEC→ATT&CK full chains should exist."""
        with driver.session() as session:
            result = session.run("""
                MATCH (w:CWE)<-[:EXPLOITS_WEAKNESS]-(c:CAPEC)-[:MAPS_TO_TECHNIQUE]->(t:Technique)
                RETURN w.cwe_id AS cwe, c.capec_id AS capec, t.attack_id AS technique
                LIMIT 5
            """)
            chains = [(r["cwe"], r["capec"], r["technique"]) for r in result]
            assert len(chains) > 0, "Should have at least one CWE→CAPEC→ATT&CK chain"
