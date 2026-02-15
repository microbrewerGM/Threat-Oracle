"""CWE XML importer — parses CWE XML and loads into Neo4j AuraDB."""
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Optional


NS = {"cwe": "http://cwe.mitre.org/cwe-7"}


@dataclass
class CWEWeakness:
    """Parsed CWE weakness node."""
    cwe_id: str
    name: str
    abstraction: str  # Pillar, Class, Base, Variant, Compound
    status: str
    description: str
    likelihood: Optional[str] = None
    related: list = field(default_factory=list)  # [(nature, target_cwe_id), ...]


def parse_cwe_xml(xml_path: str) -> list[CWEWeakness]:
    """Parse CWE XML file into a list of CWEWeakness objects."""
    tree = ET.parse(xml_path)
    root = tree.getroot()

    weaknesses = []
    for w in root.findall(".//cwe:Weakness", NS):
        cwe_id = w.get("ID")
        name = w.get("Name", "")
        abstraction = w.get("Abstraction", "")
        status = w.get("Status", "")

        desc_el = w.find("cwe:Description", NS)
        description = desc_el.text.strip() if desc_el is not None and desc_el.text else ""

        likelihood_el = w.find("cwe:Likelihood_Of_Exploit", NS)
        likelihood = likelihood_el.text.strip() if likelihood_el is not None and likelihood_el.text else None

        related = []
        for rel in w.findall(".//cwe:Related_Weakness", NS):
            nature = rel.get("Nature")
            target = rel.get("CWE_ID")
            if nature and target:
                related.append((nature, target))

        weaknesses.append(CWEWeakness(
            cwe_id=cwe_id,
            name=name,
            abstraction=abstraction,
            status=status,
            description=description,
            likelihood=likelihood,
            related=related,
        ))

    return weaknesses


def import_cwe_to_neo4j(driver, weaknesses: list[CWEWeakness], batch_size: int = 500):
    """Import parsed CWE weaknesses into Neo4j.
    
    Creates :CWE nodes and relationship edges (ChildOf, PeerOf, CanPrecede, etc.)
    Uses MERGE to be idempotent.
    """
    # Phase 1: Create all nodes
    with driver.session() as session:
        for i in range(0, len(weaknesses), batch_size):
            batch = weaknesses[i:i + batch_size]
            nodes = [
                {
                    "cwe_id": f"CWE-{w.cwe_id}",
                    "numeric_id": int(w.cwe_id),
                    "name": w.name,
                    "abstraction": w.abstraction,
                    "status": w.status,
                    "description": w.description[:2000],  # Truncate for AuraDB free tier
                    "likelihood": w.likelihood,
                }
                for w in batch
            ]
            session.run(
                """
                UNWIND $nodes AS n
                MERGE (c:CWE {cwe_id: n.cwe_id})
                SET c.name = n.name,
                    c.numeric_id = n.numeric_id,
                    c.abstraction = n.abstraction,
                    c.status = n.status,
                    c.description = n.description,
                    c.likelihood = n.likelihood
                """,
                nodes=nodes,
            )

    # Phase 2: Create relationships
    edges = []
    for w in weaknesses:
        for nature, target in w.related:
            edges.append({
                "source": f"CWE-{w.cwe_id}",
                "target": f"CWE-{target}",
                "nature": nature,
            })

    with driver.session() as session:
        for i in range(0, len(edges), batch_size):
            batch = edges[i:i + batch_size]
            session.run(
                """
                UNWIND $edges AS e
                MATCH (s:CWE {cwe_id: e.source})
                MATCH (t:CWE {cwe_id: e.target})
                CALL {
                    WITH s, t, e
                    WITH s, t, e
                    WHERE e.nature = 'ChildOf'
                    MERGE (s)-[:CHILD_OF]->(t)
                } IN TRANSACTIONS OF 1 ROWS
                """,
                edges=[e for e in batch if e["nature"] == "ChildOf"],
            )
            # Handle other relationship types
            for nature, rel_type in [
                ("PeerOf", "PEER_OF"),
                ("CanPrecede", "CAN_PRECEDE"),
                ("CanFollow", "CAN_FOLLOW"),
                ("StartsWith", "STARTS_WITH"),
                ("CanAlsoBe", "CAN_ALSO_BE"),
                ("Requires", "REQUIRES"),
            ]:
                typed_edges = [e for e in batch if e["nature"] == nature]
                if typed_edges:
                    session.run(
                        f"""
                        UNWIND $edges AS e
                        MATCH (s:CWE {{cwe_id: e.source}})
                        MATCH (t:CWE {{cwe_id: e.target}})
                        MERGE (s)-[:{rel_type}]->(t)
                        """,
                        edges=typed_edges,
                    )

    return len(weaknesses), len(edges)
