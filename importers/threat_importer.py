"""Threat importer — converts analysis findings to Neo4j Threat nodes."""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ThreatNode:
    """A threat finding ready for Neo4j import."""
    threat_id: str
    title: str
    stride_category: str
    severity: str
    description: str = ""
    likelihood: str = "possible"
    risk_score: float = 5.0
    attack_vector: str = ""
    remediation: str = ""
    confidence: float = 0.5
    cwe_ids: list[str] = field(default_factory=list)
    capec_ids: list[str] = field(default_factory=list)
    attack_technique_ids: list[str] = field(default_factory=list)
    affected_assets: list[str] = field(default_factory=list)
    analysis_tier: str = "tier_1"
    job_id: str = ""


def threats_from_findings(findings: list[dict], job_id: str) -> list[ThreatNode]:
    """Convert raw finding dicts (from LLM analysis) into ThreatNode objects.

    Args:
        findings: List of finding dicts matching ThreatFinding schema.
        job_id: The analysis job ID that produced these findings.

    Returns:
        List of ThreatNode objects ready for Neo4j import.
    """
    threats = []
    for i, f in enumerate(findings):
        threats.append(ThreatNode(
            threat_id=f"threat-{job_id}-{i}",
            title=str(f.get("title", "Unknown Threat"))[:500],
            stride_category=f.get("stride_category", "information_disclosure"),
            severity=f.get("severity", "medium"),
            description=str(f.get("description", ""))[:5000],
            likelihood=f.get("likelihood", "possible"),
            risk_score=float(f.get("risk_score", 5.0)),
            attack_vector=str(f.get("attack_vector", ""))[:2000],
            remediation=str(f.get("remediation", ""))[:5000],
            confidence=float(f.get("confidence", 0.5)),
            cwe_ids=f.get("cwe_ids", []),
            capec_ids=f.get("capec_ids", []),
            attack_technique_ids=f.get("attack_technique_ids", []),
            affected_assets=f.get("affected_assets", []),
            analysis_tier=f.get("analysis_tier", "tier_1"),
            job_id=job_id,
        ))
    return threats


def import_threats_to_neo4j(
    driver, threats: list[ThreatNode], model_id: str, batch_size: int = 500
) -> tuple[int, int]:
    """Import threat nodes into Neo4j and link to model + knowledge base.

    Creates:
      (ThreatModel)-[:HAS_THREAT]->(Threat)
      (Threat)-[:EXPLOITS]->(CWE)           — for each cwe_id
      (Threat)-[:USES_TECHNIQUE]->(Technique) — for each attack_technique_id
      (Threat)-[:LEVERAGES]->(CAPEC)         — for each capec_id

    Uses MERGE for idempotency.

    Returns:
        (nodes_created, relationships_created)
    """
    if not threats:
        return 0, 0

    total_rels = 0

    with driver.session() as session:
        # Phase 1: MERGE threat nodes and link to model
        for i in range(0, len(threats), batch_size):
            batch = threats[i:i + batch_size]
            nodes = [
                {
                    "threat_id": t.threat_id,
                    "title": t.title,
                    "stride_category": t.stride_category,
                    "severity": t.severity,
                    "description": t.description[:2000],
                    "likelihood": t.likelihood,
                    "risk_score": t.risk_score,
                    "attack_vector": t.attack_vector[:2000],
                    "remediation": t.remediation[:2000],
                    "confidence": t.confidence,
                    "analysis_tier": t.analysis_tier,
                    "job_id": t.job_id,
                    "affected_assets": t.affected_assets,
                }
                for t in batch
            ]
            result = session.run(
                """
                UNWIND $nodes AS n
                MATCH (m:ThreatModel {model_id: $model_id})
                MERGE (t:Threat {threat_id: n.threat_id})
                SET t.title = n.title,
                    t.stride_category = n.stride_category,
                    t.severity = n.severity,
                    t.description = n.description,
                    t.likelihood = n.likelihood,
                    t.risk_score = n.risk_score,
                    t.attack_vector = n.attack_vector,
                    t.remediation = n.remediation,
                    t.confidence = n.confidence,
                    t.analysis_tier = n.analysis_tier,
                    t.job_id = n.job_id,
                    t.affected_assets = n.affected_assets
                MERGE (m)-[:HAS_THREAT]->(t)
                RETURN count(t) AS cnt
                """,
                nodes=nodes,
                model_id=model_id,
            )
            total_rels += result.single()["cnt"]

        # Phase 2: Link to CWE nodes (if they exist in the graph)
        cwe_edges = []
        for t in threats:
            for cwe_id in t.cwe_ids:
                cwe_edges.append({"threat_id": t.threat_id, "cwe_id": cwe_id})

        if cwe_edges:
            for i in range(0, len(cwe_edges), batch_size):
                batch = cwe_edges[i:i + batch_size]
                result = session.run(
                    """
                    UNWIND $edges AS e
                    MATCH (t:Threat {threat_id: e.threat_id})
                    MATCH (c:CWE {cwe_id: e.cwe_id})
                    MERGE (t)-[:EXPLOITS]->(c)
                    RETURN count(*) AS cnt
                    """,
                    edges=batch,
                )
                total_rels += result.single()["cnt"]

        # Phase 3: Link to ATT&CK Technique nodes
        attack_edges = []
        for t in threats:
            for tech_id in t.attack_technique_ids:
                attack_edges.append({"threat_id": t.threat_id, "attack_id": tech_id})

        if attack_edges:
            for i in range(0, len(attack_edges), batch_size):
                batch = attack_edges[i:i + batch_size]
                result = session.run(
                    """
                    UNWIND $edges AS e
                    MATCH (t:Threat {threat_id: e.threat_id})
                    MATCH (tech:Technique {attack_id: e.attack_id})
                    MERGE (t)-[:USES_TECHNIQUE]->(tech)
                    RETURN count(*) AS cnt
                    """,
                    edges=batch,
                )
                total_rels += result.single()["cnt"]

        # Phase 4: Link to CAPEC nodes
        capec_edges = []
        for t in threats:
            for capec_id in t.capec_ids:
                capec_edges.append({"threat_id": t.threat_id, "capec_id": capec_id})

        if capec_edges:
            for i in range(0, len(capec_edges), batch_size):
                batch = capec_edges[i:i + batch_size]
                result = session.run(
                    """
                    UNWIND $edges AS e
                    MATCH (t:Threat {threat_id: e.threat_id})
                    MATCH (c:CAPEC {capec_id: e.capec_id})
                    MERGE (t)-[:LEVERAGES]->(c)
                    RETURN count(*) AS cnt
                    """,
                    edges=batch,
                )
                total_rels += result.single()["cnt"]

    return len(threats), total_rels
