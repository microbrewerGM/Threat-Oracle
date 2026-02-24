"""Threat model CRUD endpoints."""
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from neo4j import Session

from api.dependencies import get_neo4j_session, require_api_key
from api.models import (
    CreateAssetRequest,
    CreateBoundaryRequest,
    CreateDataAssetRequest,
    CreateFlowRequest,
    CreateModelRequest,
    UpdateModelRequest,
)

router = APIRouter(prefix="/api/v1/models", tags=["models"])


@router.post("")
def create_model(
    body: CreateModelRequest,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Create a new threat model."""
    model_id = f"model-{uuid4().hex[:12]}"
    result = session.run(
        """
        CREATE (m:ThreatModel {
            model_id: $model_id,
            name: $name,
            description: $description,
            version: $version,
            repo_url: $repo_url,
            created: datetime(),
            updated: datetime()
        })
        RETURN m, m.model_id AS model_id
        """,
        model_id=model_id,
        name=body.name,
        description=body.description,
        version=body.version,
        repo_url=body.repo_url,
    )
    record = result.single()
    node = dict(record["m"])
    # Convert neo4j datetime to ISO string
    for key in ("created", "updated"):
        if node.get(key):
            node[key] = str(node[key])
    return node


@router.get("")
def list_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(25, ge=1, le=100),
    session: Session = Depends(get_neo4j_session),
):
    """List all threat models."""
    result = session.run(
        "MATCH (m:ThreatModel) RETURN m ORDER BY m.updated DESC SKIP $skip LIMIT $limit",
        skip=skip,
        limit=limit,
    )
    models = []
    for record in result:
        node = dict(record["m"])
        for key in ("created", "updated"):
            if node.get(key):
                node[key] = str(node[key])
        models.append(node)
    return {"models": models, "skip": skip, "limit": limit}


@router.get("/{model_id}")
def get_model(
    model_id: str,
    session: Session = Depends(get_neo4j_session),
):
    """Get a threat model by ID with all its assets."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        OPTIONAL MATCH (m)-[:HAS_ASSET]->(ta:TechnicalAsset)
        OPTIONAL MATCH (m)-[:HAS_BOUNDARY]->(tb:TrustBoundary)
        OPTIONAL MATCH (m)-[:HAS_FLOW]->(df:DataFlow)
        OPTIONAL MATCH (m)-[:HAS_DATA_ASSET]->(da:DataAsset)
        RETURN m,
               collect(DISTINCT properties(ta)) AS technical_assets,
               collect(DISTINCT properties(tb)) AS trust_boundaries,
               collect(DISTINCT properties(df)) AS data_flows,
               collect(DISTINCT properties(da)) AS data_assets
        """,
        model_id=model_id,
    )
    record = result.single()
    if not record or record["m"] is None:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

    node = dict(record["m"])
    for key in ("created", "updated"):
        if node.get(key):
            node[key] = str(node[key])

    # Filter out empty dicts from optional matches
    def filter_empty(items):
        return [i for i in items if i]

    return {
        "model": node,
        "technical_assets": filter_empty(record["technical_assets"]),
        "trust_boundaries": filter_empty(record["trust_boundaries"]),
        "data_flows": filter_empty(record["data_flows"]),
        "data_assets": filter_empty(record["data_assets"]),
    }


@router.put("/{model_id}")
def update_model(
    model_id: str,
    body: UpdateModelRequest,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Update a threat model's properties."""
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        SET m.name = COALESCE($name, m.name),
            m.description = COALESCE($description, m.description),
            m.version = COALESCE($version, m.version),
            m.repo_url = COALESCE($repo_url, m.repo_url),
            m.updated = datetime()
        RETURN m
        """,
        model_id=model_id,
        name=updates.get("name"),
        description=updates.get("description"),
        version=updates.get("version"),
        repo_url=updates.get("repo_url"),
    )
    record = result.single()
    if not record:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

    node = dict(record["m"])
    for key in ("created", "updated"):
        if node.get(key):
            node[key] = str(node[key])
    return node


@router.delete("/{model_id}")
def delete_model(
    model_id: str,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Delete a threat model and all its related nodes."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        OPTIONAL MATCH (m)-[r]->(child)
        DETACH DELETE child, m
        RETURN count(m) AS deleted
        """,
        model_id=model_id,
    )
    record = result.single()
    if record["deleted"] == 0:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return {"status": "deleted", "model_id": model_id}


# --- Technical Asset CRUD within a model ---


@router.post("/{model_id}/assets")
def add_technical_asset(
    model_id: str,
    body: CreateAssetRequest,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Add a technical asset to a threat model."""
    asset_id = f"ta-{uuid4().hex[:12]}"
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        CREATE (ta:TechnicalAsset {
            asset_id: $asset_id,
            name: $name,
            type: $type,
            description: $description
        })
        CREATE (m)-[:HAS_ASSET]->(ta)
        RETURN ta
        """,
        model_id=model_id,
        asset_id=asset_id,
        name=body.name,
        type=body.type,
        description=body.description,
    )
    record = result.single()
    if not record:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return dict(record["ta"])


@router.delete("/{model_id}/assets/{asset_id}")
def delete_technical_asset(
    model_id: str,
    asset_id: str,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Remove a technical asset from a threat model."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})-[:HAS_ASSET]->(ta:TechnicalAsset {asset_id: $asset_id})
        DETACH DELETE ta
        RETURN count(ta) AS deleted
        """,
        model_id=model_id,
        asset_id=asset_id,
    )
    record = result.single()
    if record["deleted"] == 0:
        raise HTTPException(status_code=404, detail="Asset not found")
    return {"status": "deleted", "asset_id": asset_id}


# --- Trust Boundary CRUD within a model ---


@router.post("/{model_id}/boundaries")
def add_trust_boundary(
    model_id: str,
    body: CreateBoundaryRequest,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Add a trust boundary to a threat model."""
    boundary_id = f"tb-{uuid4().hex[:12]}"
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        CREATE (tb:TrustBoundary {
            boundary_id: $boundary_id,
            name: $name,
            type: $type,
            description: $description
        })
        CREATE (m)-[:HAS_BOUNDARY]->(tb)
        RETURN tb
        """,
        model_id=model_id,
        boundary_id=boundary_id,
        name=body.name,
        type=body.type,
        description=body.description,
    )
    record = result.single()
    if not record:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return dict(record["tb"])


@router.delete("/{model_id}/boundaries/{boundary_id}")
def delete_trust_boundary(
    model_id: str,
    boundary_id: str,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Remove a trust boundary from a threat model."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})-[:HAS_BOUNDARY]->(tb:TrustBoundary {boundary_id: $boundary_id})
        DETACH DELETE tb
        RETURN count(tb) AS deleted
        """,
        model_id=model_id,
        boundary_id=boundary_id,
    )
    record = result.single()
    if record["deleted"] == 0:
        raise HTTPException(status_code=404, detail="Boundary not found")
    return {"status": "deleted", "boundary_id": boundary_id}


# --- Data Flow CRUD within a model ---


@router.post("/{model_id}/flows")
def add_data_flow(
    model_id: str,
    body: CreateFlowRequest,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Add a data flow to a threat model."""
    flow_id = f"df-{uuid4().hex[:12]}"
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        CREATE (df:DataFlow {
            flow_id: $flow_id,
            name: $name,
            source: $source,
            target: $target,
            protocol: $protocol,
            description: $description
        })
        CREATE (m)-[:HAS_FLOW]->(df)
        RETURN df
        """,
        model_id=model_id,
        flow_id=flow_id,
        name=body.name,
        source=body.source,
        target=body.target,
        protocol=body.protocol,
        description=body.description,
    )
    record = result.single()
    if not record:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return dict(record["df"])


@router.delete("/{model_id}/flows/{flow_id}")
def delete_data_flow(
    model_id: str,
    flow_id: str,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Remove a data flow from a threat model."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})-[:HAS_FLOW]->(df:DataFlow {flow_id: $flow_id})
        DETACH DELETE df
        RETURN count(df) AS deleted
        """,
        model_id=model_id,
        flow_id=flow_id,
    )
    record = result.single()
    if record["deleted"] == 0:
        raise HTTPException(status_code=404, detail="Flow not found")
    return {"status": "deleted", "flow_id": flow_id}


# --- Data Asset CRUD within a model ---


@router.post("/{model_id}/data-assets")
def add_data_asset(
    model_id: str,
    body: CreateDataAssetRequest,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Add a data asset to a threat model."""
    data_asset_id = f"da-{uuid4().hex[:12]}"
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        CREATE (da:DataAsset {
            data_asset_id: $data_asset_id,
            name: $name,
            classification: $classification,
            description: $description
        })
        CREATE (m)-[:HAS_DATA_ASSET]->(da)
        RETURN da
        """,
        model_id=model_id,
        data_asset_id=data_asset_id,
        name=body.name,
        classification=body.classification,
        description=body.description,
    )
    record = result.single()
    if not record:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    return dict(record["da"])


@router.delete("/{model_id}/data-assets/{data_asset_id}")
def delete_data_asset(
    model_id: str,
    data_asset_id: str,
    session: Session = Depends(get_neo4j_session),
    _auth: str = Depends(require_api_key),
):
    """Remove a data asset from a threat model."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})-[:HAS_DATA_ASSET]->(da:DataAsset {data_asset_id: $data_asset_id})
        DETACH DELETE da
        RETURN count(da) AS deleted
        """,
        model_id=model_id,
        data_asset_id=data_asset_id,
    )
    record = result.single()
    if record["deleted"] == 0:
        raise HTTPException(status_code=404, detail="Data asset not found")
    return {"status": "deleted", "data_asset_id": data_asset_id}
