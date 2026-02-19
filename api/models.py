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
