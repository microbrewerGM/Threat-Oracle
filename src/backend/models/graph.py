"""
Core graph data structure models for Threat Oracle.

This module defines the base classes for graph nodes and edges,
providing a foundation for specific node and edge types.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID, uuid4
from pydantic import BaseModel, Field, validator


class Node(BaseModel):
    """Base class for all graph nodes."""

    id: UUID = Field(default_factory=uuid4, description="Unique node identifier")
    name: str = Field(..., description="Node name")
    description: Optional[str] = Field(None, description="Node description")
    labels: Set[str] = Field(default_factory=set, description="Node labels/types")
    properties: Dict[str, Any] = Field(
        default_factory=dict, description="Additional node properties"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    class Config:
        """Pydantic model configuration."""
        
        arbitrary_types_allowed = True

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the node to a dictionary suitable for Neo4j.
        
        Returns:
            Dictionary representation of the node.
        """
        result = self.dict(exclude={"labels"})
        result["id"] = str(result["id"])  # Convert UUID to string
        result["created_at"] = result["created_at"].isoformat()
        result["updated_at"] = result["updated_at"].isoformat()
        return result

    @validator("updated_at", always=True)
    def set_updated_at(cls, v: datetime, values: Dict[str, Any]) -> datetime:
        """Set updated_at to current time on each update."""
        return datetime.utcnow()


class Edge(BaseModel):
    """Base class for all graph edges (relationships)."""

    id: UUID = Field(default_factory=uuid4, description="Unique edge identifier")
    source_id: UUID = Field(..., description="Source node ID")
    target_id: UUID = Field(..., description="Target node ID")
    type: str = Field(..., description="Edge type/label")
    properties: Dict[str, Any] = Field(
        default_factory=dict, description="Additional edge properties"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow, description="Last update timestamp"
    )

    class Config:
        """Pydantic model configuration."""
        
        arbitrary_types_allowed = True

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert the edge to a dictionary suitable for Neo4j.
        
        Returns:
            Dictionary representation of the edge.
        """
        result = self.dict()
        result["id"] = str(result["id"])
        result["source_id"] = str(result["source_id"])
        result["target_id"] = str(result["target_id"])
        result["created_at"] = result["created_at"].isoformat()
        result["updated_at"] = result["updated_at"].isoformat()
        return result

    @validator("updated_at", always=True)
    def set_updated_at(cls, v: datetime, values: Dict[str, Any]) -> datetime:
        """Set updated_at to current time on each update."""
        return datetime.utcnow()


class Graph(BaseModel):
    """Graph model representing a collection of nodes and edges."""

    nodes: List[Node] = Field(default_factory=list, description="Graph nodes")
    edges: List[Edge] = Field(default_factory=list, description="Graph edges")

    def add_node(self, node: Node) -> None:
        """
        Add a node to the graph.
        
        Args:
            node: Node to add
        """
        self.nodes.append(node)

    def add_edge(self, edge: Edge) -> None:
        """
        Add an edge to the graph.
        
        Args:
            edge: Edge to add
        """
        self.edges.append(edge)

    def get_node_by_id(self, node_id: UUID) -> Optional[Node]:
        """
        Get a node by its ID.
        
        Args:
            node_id: Node ID to search for
            
        Returns:
            Node if found, None otherwise
        """
        for node in self.nodes:
            if node.id == node_id:
                return node
        return None

    def get_edge_by_id(self, edge_id: UUID) -> Optional[Edge]:
        """
        Get an edge by its ID.
        
        Args:
            edge_id: Edge ID to search for
            
        Returns:
            Edge if found, None otherwise
        """
        for edge in self.edges:
            if edge.id == edge_id:
                return edge
        return None

    def get_connected_nodes(self, node_id: UUID) -> List[Node]:
        """
        Get all nodes connected to the specified node.
        
        Args:
            node_id: Node ID to find connections for
            
        Returns:
            List of connected nodes
        """
        connected_ids = set()
        for edge in self.edges:
            if edge.source_id == node_id:
                connected_ids.add(edge.target_id)
            elif edge.target_id == node_id:
                connected_ids.add(edge.source_id)
        
        return [node for node in self.nodes if node.id in connected_ids]
