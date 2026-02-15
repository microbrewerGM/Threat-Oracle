"""MITRE ATT&CK STIX 2.1 importer — parses enterprise-attack.json into Neo4j."""
import json
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ATTACKObject:
    """Generic ATT&CK object."""
    stix_id: str
    attack_id: str  # e.g., T1055.011
    name: str
    obj_type: str  # Technique, Tactic, Mitigation, Group, Software
    description: str = ""
    tactics: list[str] = field(default_factory=list)
    deprecated: bool = False
    revoked: bool = False


@dataclass
class ATTACKRelationship:
    """ATT&CK relationship between objects."""
    source_ref: str
    target_ref: str
    rel_type: str  # uses, mitigates, subtechnique-of, etc.


def parse_attack_stix(json_path: str) -> tuple[list[ATTACKObject], list[ATTACKRelationship]]:
    """Parse ATT&CK STIX bundle into objects and relationships."""
    with open(json_path) as f:
        bundle = json.load(f)

    objects = []
    relationships = []

    # Map STIX types to our labels
    type_map = {
        "attack-pattern": "Technique",
        "x-mitre-tactic": "Tactic",
        "course-of-action": "Mitigation",
        "intrusion-set": "Group",
        "malware": "Software",
        "tool": "Software",
        "campaign": "Campaign",
        "x-mitre-data-source": "DataSource",
        "x-mitre-data-component": "DataComponent",
    }

    for obj in bundle.get("objects", []):
        stix_type = obj.get("type", "")

        if stix_type == "relationship":
            rel_type = obj.get("relationship_type", "")
            source = obj.get("source_ref", "")
            target = obj.get("target_ref", "")
            if source and target and rel_type:
                relationships.append(ATTACKRelationship(
                    source_ref=source,
                    target_ref=target,
                    rel_type=rel_type,
                ))
            continue

        if stix_type not in type_map:
            continue

        # Extract ATT&CK ID from external_references
        attack_id = ""
        for ref in obj.get("external_references", []):
            if ref.get("source_name") == "mitre-attack":
                attack_id = ref.get("external_id", "")
                break

        if not attack_id:
            continue

        # Extract tactics from kill_chain_phases
        tactics = []
        for phase in obj.get("kill_chain_phases", []):
            if phase.get("kill_chain_name") == "mitre-attack":
                tactics.append(phase["phase_name"])

        objects.append(ATTACKObject(
            stix_id=obj["id"],
            attack_id=attack_id,
            name=obj.get("name", ""),
            obj_type=type_map[stix_type],
            description=obj.get("description", "")[:2000],
            tactics=tactics,
            deprecated=obj.get("x_mitre_deprecated", False),
            revoked=obj.get("revoked", False),
        ))

    return objects, relationships


def import_attack_to_neo4j(driver, objects: list[ATTACKObject], relationships: list[ATTACKRelationship], batch_size: int = 500):
    """Import ATT&CK objects and relationships into Neo4j."""
    # Build stix_id → ATTACKObject lookup for filtering valid rels
    valid_ids = {o.stix_id for o in objects}

    # Phase 1: Create nodes by type
    with driver.session() as session:
        for obj_type in ("Technique", "Tactic", "Mitigation", "Group", "Software", "Campaign", "DataSource", "DataComponent"):
            typed = [o for o in objects if o.obj_type == obj_type]
            for i in range(0, len(typed), batch_size):
                batch = typed[i:i + batch_size]
                nodes = [
                    {
                        "stix_id": o.stix_id,
                        "attack_id": o.attack_id,
                        "name": o.name,
                        "description": o.description,
                        "tactics": o.tactics,
                        "deprecated": o.deprecated,
                        "revoked": o.revoked,
                    }
                    for o in batch
                ]
                session.run(
                    f"""
                    UNWIND $nodes AS n
                    MERGE (a:{obj_type} {{attack_id: n.attack_id}})
                    SET a.stix_id = n.stix_id,
                        a.name = n.name,
                        a.description = n.description,
                        a.tactics = n.tactics,
                        a.deprecated = n.deprecated,
                        a.revoked = n.revoked
                    """,
                    nodes=nodes,
                )

    # Phase 2: Create relationships
    # Map rel_type to Neo4j relationship type
    rel_map = {
        "uses": "USES",
        "mitigates": "MITIGATES",
        "subtechnique-of": "SUBTECHNIQUE_OF",
        "detects": "DETECTS",
        "attributed-to": "ATTRIBUTED_TO",
        "targets": "TARGETS",
        "revoked-by": "REVOKED_BY",
    }

    # Build stix_id → (label, attack_id) for matching
    id_to_info = {o.stix_id: (o.obj_type, o.attack_id) for o in objects}

    with driver.session() as session:
        for rel_type, neo4j_type in rel_map.items():
            typed_rels = [r for r in relationships if r.rel_type == rel_type
                          and r.source_ref in valid_ids and r.target_ref in valid_ids]
            if not typed_rels:
                continue

            edges = []
            for r in typed_rels:
                src_label, src_id = id_to_info[r.source_ref]
                tgt_label, tgt_id = id_to_info[r.target_ref]
                edges.append({
                    "src_label": src_label,
                    "src_id": src_id,
                    "tgt_label": tgt_label,
                    "tgt_id": tgt_id,
                })

            # Group by src_label + tgt_label combo for typed MATCH
            combos = {}
            for e in edges:
                key = (e["src_label"], e["tgt_label"])
                combos.setdefault(key, []).append(e)

            for (src_label, tgt_label), combo_edges in combos.items():
                for i in range(0, len(combo_edges), batch_size):
                    batch = combo_edges[i:i + batch_size]
                    session.run(
                        f"""
                        UNWIND $edges AS e
                        MATCH (s:{src_label} {{attack_id: e.src_id}})
                        MATCH (t:{tgt_label} {{attack_id: e.tgt_id}})
                        MERGE (s)-[:{neo4j_type}]->(t)
                        """,
                        edges=batch,
                    )

    return len(objects), len(relationships)
