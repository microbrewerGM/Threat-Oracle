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
