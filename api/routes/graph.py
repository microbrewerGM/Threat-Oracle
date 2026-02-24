"""Graph query endpoints for browsing the threat knowledge graph."""
from typing import Optional

from fastapi import APIRouter, Depends, Query
from neo4j import Session

from api.dependencies import get_neo4j_session
from api.models import GraphStatsResponse, NodeDetailResponse, NodeListResponse, SearchResponse

router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


@router.get("/stats", response_model=GraphStatsResponse)
def graph_stats(session: Session = Depends(get_neo4j_session)):
    """Get graph statistics: node counts by label, total relationships."""
    label_result = session.run("CALL db.labels() YIELD label RETURN label")
    labels = [r["label"] for r in label_result]

    node_counts = {}
    for label in labels:
        count_result = session.run(
            f"MATCH (n:`{label}`) RETURN count(n) AS count"
        )
        node_counts[label] = count_result.single()["count"]

    # Total relationships
    rel_result = session.run("MATCH ()-[r]->() RETURN count(r) AS count")
    total_relationships = rel_result.single()["count"]

    # Relationship type counts
    rel_type_result = session.run(
        "CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType"
    )
    rel_types = [r["relationshipType"] for r in rel_type_result]

    rel_counts = {}
    for rel_type in rel_types:
        count_result = session.run(
            f"MATCH ()-[r:`{rel_type}`]->() RETURN count(r) AS count"
        )
        rel_counts[rel_type] = count_result.single()["count"]

    return {
        "node_counts": node_counts,
        "total_nodes": sum(node_counts.values()),
        "relationship_counts": rel_counts,
        "total_relationships": total_relationships,
    }


@router.get("/nodes", response_model=NodeListResponse)
def list_nodes(
    label: Optional[str] = Query(None, description="Filter by node label (e.g., CWE, Technique, CAPEC)"),
    search: Optional[str] = Query(None, description="Search node names"),
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
    session: Session = Depends(get_neo4j_session),
):
    """List nodes with optional filtering by label and name search."""
    if label:
        query = f"MATCH (n:`{label}`)"
    else:
        query = "MATCH (n)"

    conditions = []
    params: dict = {"skip": skip, "limit": limit}

    if search:
        conditions.append("n.name CONTAINS $search")
        params["search"] = search

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " RETURN n, labels(n) AS labels ORDER BY n.name SKIP $skip LIMIT $limit"

    result = session.run(query, params)
    nodes = []
    for record in result:
        node = dict(record["n"])
        node["_labels"] = record["labels"]
        nodes.append(node)

    return {"nodes": nodes, "skip": skip, "limit": limit}


@router.get("/nodes/{node_id}", response_model=NodeDetailResponse)
def get_node(
    node_id: str,
    session: Session = Depends(get_neo4j_session),
):
    """Get a single node by its primary ID with its relationships.

    Accepts CWE IDs (CWE-79), ATT&CK IDs (T1059), or CAPEC IDs (CAPEC-1).
    """
    # Try matching by different ID fields
    result = session.run(
        """
        MATCH (n)
        WHERE n.cwe_id = $id OR n.attack_id = $id OR n.capec_id = $id
        OPTIONAL MATCH (n)-[r]->(target)
        OPTIONAL MATCH (source)-[r2]->(n)
        RETURN n, labels(n) AS labels,
               collect(DISTINCT {type: type(r), target: properties(target), target_labels: labels(target)}) AS outgoing,
               collect(DISTINCT {type: type(r2), source: properties(source), source_labels: labels(source)}) AS incoming
        """,
        id=node_id,
    )

    record = result.single()
    if not record:
        return {"error": "Node not found", "node_id": node_id}

    node = dict(record["n"])
    node["_labels"] = record["labels"]

    # Filter out null entries from optional matches
    outgoing = [r for r in record["outgoing"] if r["type"] is not None]
    incoming = [r for r in record["incoming"] if r["type"] is not None]

    return {
        "node": node,
        "relationships": {
            "outgoing": outgoing,
            "incoming": incoming,
        },
    }


@router.get("/search", response_model=SearchResponse)
def search_graph(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_neo4j_session),
):
    """Full-text search across all node names and descriptions."""
    result = session.run(
        """
        MATCH (n)
        WHERE n.name CONTAINS $q OR n.description CONTAINS $q
        RETURN n, labels(n) AS labels
        ORDER BY
            CASE WHEN n.name CONTAINS $q THEN 0 ELSE 1 END,
            n.name
        LIMIT $limit
        """,
        q=q,
        limit=limit,
    )

    nodes = []
    for record in result:
        node = dict(record["n"])
        node["_labels"] = record["labels"]
        nodes.append(node)

    return {"query": q, "results": nodes, "count": len(nodes)}
