"""
Graph repository for Neo4j database operations.

This module provides a repository for CRUD operations on graph nodes and edges,
allowing the application to interact with the Neo4j database.
"""

import logging
from typing import Any, Dict, List, Optional, Set, Union
from uuid import UUID, uuid4

from neo4j import Result, Transaction

from src.backend.database.neo4j_client import neo4j_client
from src.backend.models.graph import Node, Edge, Graph

logger = logging.getLogger(__name__)


class GraphRepository:
    """Repository for graph operations on Neo4j database."""

    def create_node(self, node: Node) -> Node:
        """
        Create a node in the database.
        
        Args:
            node: Node to create
            
        Returns:
            Created node with updated properties
        """
        query = """
        CREATE (n:Node $props)
        WITH n
        MATCH (n)
        RETURN n
        """
        
        props = node.to_dict()
        
        # Add labels to the node
        for label in node.labels:
            query = query.replace("CREATE (n:Node", f"CREATE (n:Node:{label}")
        
        def create_node_tx(tx: Transaction) -> Node:
            result = neo4j_client.run_query_in_transaction(tx, query, {"props": props})
            record = result.single()
            if not record:
                raise ValueError("Failed to create node")
            return node  # Return the original node for now
        
        return neo4j_client.execute_write_transaction(create_node_tx)

    def get_node_by_id(self, node_id: UUID) -> Optional[Node]:
        """
        Get a node by its ID.
        
        Args:
            node_id: Node ID to retrieve
            
        Returns:
            Node if found, None otherwise
        """
        query = """
        MATCH (n)
        WHERE n.id = $node_id
        RETURN n
        """
        
        def get_node_tx(tx: Transaction) -> Optional[Node]:
            result = neo4j_client.run_query_in_transaction(
                tx, query, {"node_id": str(node_id)}
            )
            record = result.single()
            if not record:
                return None
            
            # Convert Neo4j node to Node model
            node_data = dict(record["n"])
            # Handle conversion from Neo4j types to Python types if needed
            
            # This is a simplified conversion - in a real app, you'd need more logic
            # to handle the specific node types and properties
            labels = set(record["n"].labels) - {"Node"}
            
            return Node(
                id=UUID(node_data.get("id")),
                name=node_data.get("name", ""),
                description=node_data.get("description"),
                labels=labels,
                properties={k: v for k, v in node_data.items() 
                            if k not in ["id", "name", "description", "created_at", "updated_at"]},
                created_at=node_data.get("created_at"),
                updated_at=node_data.get("updated_at")
            )
        
        return neo4j_client.execute_read_transaction(get_node_tx)

    def update_node(self, node: Node) -> Node:
        """
        Update a node in the database.
        
        Args:
            node: Node to update
            
        Returns:
            Updated node
        """
        query = """
        MATCH (n)
        WHERE n.id = $id
        SET n = $props
        RETURN n
        """
        
        props = node.to_dict()
        
        def update_node_tx(tx: Transaction) -> Node:
            result = neo4j_client.run_query_in_transaction(
                tx, query, {"id": str(node.id), "props": props}
            )
            record = result.single()
            if not record:
                raise ValueError(f"Node with ID {node.id} not found")
            return node  # Return the original node for now
        
        return neo4j_client.execute_write_transaction(update_node_tx)

    def delete_node(self, node_id: UUID) -> bool:
        """
        Delete a node from the database.
        
        Args:
            node_id: ID of the node to delete
            
        Returns:
            True if the node was deleted, False otherwise
        """
        query = """
        MATCH (n)
        WHERE n.id = $node_id
        DETACH DELETE n
        RETURN count(n) as deleted_count
        """
        
        def delete_node_tx(tx: Transaction) -> bool:
            result = neo4j_client.run_query_in_transaction(
                tx, query, {"node_id": str(node_id)}
            )
            record = result.single()
            return record and record["deleted_count"] > 0
        
        return neo4j_client.execute_write_transaction(delete_node_tx)

    def create_edge(self, edge: Edge) -> Edge:
        """
        Create an edge in the database.
        
        Args:
            edge: Edge to create
            
        Returns:
            Created edge with updated properties
        """
        query = """
        MATCH (source), (target)
        WHERE source.id = $source_id AND target.id = $target_id
        CREATE (source)-[r:`{}`]->(target)
        SET r = $props
        RETURN r
        """.format(edge.type)
        
        props = edge.to_dict()
        # Remove ids that are set separately
        props.pop("source_id", None)
        props.pop("target_id", None)
        props.pop("type", None)
        
        def create_edge_tx(tx: Transaction) -> Edge:
            result = neo4j_client.run_query_in_transaction(
                tx, 
                query, 
                {
                    "source_id": str(edge.source_id), 
                    "target_id": str(edge.target_id),
                    "props": props
                }
            )
            record = result.single()
            if not record:
                raise ValueError("Failed to create edge")
            return edge  # Return the original edge for now
        
        return neo4j_client.execute_write_transaction(create_edge_tx)

    def get_graph(self, limit: int = 100) -> Graph:
        """
        Get a graph with nodes and edges from the database.
        
        Args:
            limit: Maximum number of nodes to retrieve
            
        Returns:
            Graph containing nodes and edges
        """
        nodes_query = """
        MATCH (n)
        RETURN n
        LIMIT $limit
        """
        
        edges_query = """
        MATCH (source)-[r]->(target)
        WHERE source.id IS NOT NULL AND target.id IS NOT NULL
        RETURN source.id as source_id, r, target.id as target_id
        LIMIT $limit
        """
        
        def get_graph_tx(tx: Transaction) -> Graph:
            graph = Graph()
            
            # Get nodes
            nodes_result = neo4j_client.run_query_in_transaction(
                tx, nodes_query, {"limit": limit}
            )
            
            for record in nodes_result:
                neo4j_node = record["n"]
                node_data = dict(neo4j_node)
                
                # Convert Neo4j node to Node model
                labels = set(neo4j_node.labels) - {"Node"}
                
                try:
                    node = Node(
                        id=UUID(node_data.get("id")),
                        name=node_data.get("name", ""),
                        description=node_data.get("description"),
                        labels=labels,
                        properties={k: v for k, v in node_data.items() 
                                    if k not in ["id", "name", "description", "created_at", "updated_at"]},
                        created_at=node_data.get("created_at"),
                        updated_at=node_data.get("updated_at")
                    )
                    graph.add_node(node)
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to convert node {node_data.get('id')}: {e}")
            
            # Get edges
            edges_result = neo4j_client.run_query_in_transaction(
                tx, edges_query, {"limit": limit}
            )
            
            for record in edges_result:
                try:
                    neo4j_rel = record["r"]
                    rel_data = dict(neo4j_rel)
                    rel_type = neo4j_rel.type
                    
                    edge = Edge(
                        id=UUID(rel_data.get("id")) if rel_data.get("id") else uuid4(),
                        source_id=UUID(record["source_id"]),
                        target_id=UUID(record["target_id"]),
                        type=rel_type,
                        properties={k: v for k, v in rel_data.items() 
                                    if k not in ["id", "created_at", "updated_at"]},
                        created_at=rel_data.get("created_at"),
                        updated_at=rel_data.get("updated_at")
                    )
                    graph.add_edge(edge)
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to convert edge: {e}")
            
            return graph
        
        return neo4j_client.execute_read_transaction(get_graph_tx)


# Global repository instance
graph_repository = GraphRepository()
