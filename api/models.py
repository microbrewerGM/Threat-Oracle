"""Pydantic response models for OpenAPI documentation."""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# --- Health ---

class HealthResponse(BaseModel):
    status: str = Field(...)


class DbHealthResponse(BaseModel):
    status: str = Field(...)
    database: str = Field(...)
    error: Optional[str] = None


# --- Graph ---

class GraphStatsResponse(BaseModel):
    node_counts: Dict[str, int] = Field(..., description="Node count per label")
    total_nodes: int
    relationship_counts: Dict[str, int] = Field(
        ..., description="Relationship count per type"
    )
    total_relationships: int


class NodeListResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    skip: int
    limit: int


class NodeDetailResponse(BaseModel):
    node: Dict[str, Any]
    relationships: Dict[str, List[Dict[str, Any]]]


class SearchResponse(BaseModel):
    query: str
    results: List[Dict[str, Any]]
    count: int


# --- Import ---

class ImportResponse(BaseModel):
    source: str
    status: str
    nodes_imported: int = 0
    relationships_imported: int = 0
    cwe_relationships: Optional[int] = Field(
        None, description="CWE edge count (CAPEC imports only)"
    )
    attack_relationships: Optional[int] = Field(
        None, description="ATT&CK edge count (CAPEC imports only)"
    )


# --- Request Models ---

class CreateModelRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field("", max_length=5000)
    version: str = Field("0.1.0", max_length=50)
    repo_url: str = Field("", max_length=500)


class UpdateModelRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=5000)
    version: Optional[str] = Field(None, max_length=50)
    repo_url: Optional[str] = Field(None, max_length=500)


class CreateAssetRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field("process", max_length=50)
    description: str = Field("", max_length=5000)


class CreateBoundaryRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field("network", max_length=50)
    description: str = Field("", max_length=5000)


class CreateFlowRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    source: str = Field("", max_length=255)
    target: str = Field("", max_length=255)
    protocol: str = Field("", max_length=50)
    description: str = Field("", max_length=5000)


class CreateDataAssetRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    classification: str = Field("internal", max_length=50)
    description: str = Field("", max_length=5000)


# --- Analysis ---

class AnalyzeModelRequest(BaseModel):
    tier: str = Field("tier_1", pattern=r"^tier_[012]$", description="Analysis tier: tier_0, tier_1, or tier_2")


class AnalysisJobResponse(BaseModel):
    job_id: str
    model_id: str
    status: str
    message: str = ""


class AnalysisStatusResponse(BaseModel):
    job_id: str
    model_id: str
    tier: str
    status: str
    progress_pct: int = Field(0, ge=0, le=100)
    current_phase: Optional[int] = None
    units_completed: int = 0
    units_total: int = 0
    threats_found: int = 0
    error: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None


class ThreatResponse(BaseModel):
    threat_id: str
    title: str
    stride_category: str
    severity: str
    likelihood: str = "possible"
    risk_score: float = 5.0
    attack_vector: str = ""
    description: str = ""
    remediation: str = ""
    confidence: float = 0.5
    cwe_ids: List[str] = Field(default_factory=list)
    capec_ids: List[str] = Field(default_factory=list)
    attack_technique_ids: List[str] = Field(default_factory=list)
    affected_assets: List[str] = Field(default_factory=list)
    analysis_tier: str = "tier_1"
    job_id: str = ""


class ThreatsListResponse(BaseModel):
    model_id: str
    threats: List[ThreatResponse]
    total: int
