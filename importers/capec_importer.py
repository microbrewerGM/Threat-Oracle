"""CAPEC XML importer — bridges CWE weaknesses to ATT&CK techniques."""
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Optional


NS = {"capec": "http://capec.mitre.org/capec-3"}


@dataclass
class CAPECPattern:
    """Parsed CAPEC attack pattern."""
    capec_id: str
    name: str
    status: str
    description: str = ""
    related_cwes: list[str] = field(default_factory=list)       # CWE IDs
    related_attacks: list[str] = field(default_factory=list)    # ATT&CK technique IDs (e.g., "1574.010")


def parse_capec_xml(xml_path: str) -> list[CAPECPattern]:
    """Parse CAPEC XML into attack patterns with CWE and ATT&CK links."""
    tree = ET.parse(xml_path)
    root = tree.getroot()

    patterns = []
    for ap in root.findall(".//capec:Attack_Pattern", NS):
        capec_id = ap.get("ID", "")
        name = ap.get("Name", "")
        status = ap.get("Status", "")

        desc_el = ap.find("capec:Description", NS)
        description = ""
        if desc_el is not None:
            description = ET.tostring(desc_el, encoding="unicode", method="text").strip()[:2000]

        # Related CWEs
        related_cwes = []
        for rw in ap.findall(".//capec:Related_Weakness", NS):
            cwe_id = rw.get("CWE_ID")
            if cwe_id:
                related_cwes.append(cwe_id)

        # ATT&CK taxonomy mappings
        related_attacks = []
        for tm in ap.findall(".//capec:Taxonomy_Mapping", NS):
            if tm.get("Taxonomy_Name") == "ATTACK":
                entry_id = tm.find("capec:Entry_ID", NS)
                if entry_id is not None and entry_id.text:
                    # CAPEC stores as "1574.010", we need "T1574.010"
                    attack_id = f"T{entry_id.text}"
                    related_attacks.append(attack_id)

        patterns.append(CAPECPattern(
            capec_id=capec_id,
            name=name,
            status=status,
            description=description,
            related_cwes=related_cwes,
            related_attacks=related_attacks,
        ))

    return patterns


def import_capec_to_neo4j(driver, patterns: list[CAPECPattern], batch_size: int = 500):
    """Import CAPEC patterns and bridge CWE↔CAPEC↔ATT&CK."""
    # Phase 1: Create CAPEC nodes
    with driver.session() as session:
        for i in range(0, len(patterns), batch_size):
            batch = patterns[i:i + batch_size]
            nodes = [
                {
                    "capec_id": f"CAPEC-{p.capec_id}",
                    "numeric_id": int(p.capec_id),
                    "name": p.name,
                    "status": p.status,
                    "description": p.description,
                }
                for p in batch
            ]
            session.run(
                """
                UNWIND $nodes AS n
                MERGE (c:CAPEC {capec_id: n.capec_id})
                SET c.name = n.name,
                    c.numeric_id = n.numeric_id,
                    c.status = n.status,
                    c.description = n.description
                """,
                nodes=nodes,
            )

    # Phase 2: CAPEC → CWE relationships
    cwe_edges = []
    for p in patterns:
        for cwe_id in p.related_cwes:
            cwe_edges.append({"capec": f"CAPEC-{p.capec_id}", "cwe": f"CWE-{cwe_id}"})

    with driver.session() as session:
        for i in range(0, len(cwe_edges), batch_size):
            batch = cwe_edges[i:i + batch_size]
            session.run(
                """
                UNWIND $edges AS e
                MATCH (c:CAPEC {capec_id: e.capec})
                MATCH (w:CWE {cwe_id: e.cwe})
                MERGE (c)-[:EXPLOITS_WEAKNESS]->(w)
                """,
                edges=batch,
            )

    # Phase 3: CAPEC → ATT&CK Technique relationships
    attack_edges = []
    for p in patterns:
        for attack_id in p.related_attacks:
            attack_edges.append({"capec": f"CAPEC-{p.capec_id}", "attack_id": attack_id})

    with driver.session() as session:
        for i in range(0, len(attack_edges), batch_size):
            batch = attack_edges[i:i + batch_size]
            session.run(
                """
                UNWIND $edges AS e
                MATCH (c:CAPEC {capec_id: e.capec})
                MATCH (t:Technique {attack_id: e.attack_id})
                MERGE (c)-[:MAPS_TO_TECHNIQUE]->(t)
                """,
                edges=batch,
            )

    return len(patterns), len(cwe_edges), len(attack_edges)
