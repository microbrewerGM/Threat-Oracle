"""
Main application module for the Threat Oracle backend.

This module initializes the FastAPI application, sets up routes,
middleware, and starts the server.
"""

import logging
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from uuid import UUID

from src.backend.config import settings
from src.backend.models.graph import Node, Edge, Graph
from src.backend.database.neo4j_client import neo4j_client
from src.backend.database.graph_repository import graph_repository

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Threat Oracle API",
    description="API for the Threat Oracle threat modeling tool",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shutdown event handler
@app.on_event("shutdown")
async def shutdown():
    """Close database connections when the app shuts down."""
    logger.info("Shutting down Threat Oracle API")
    neo4j_client.close()


# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Check if the API is running.
    
    Returns:
        Dictionary with status message
    """
    return {"status": "ok"}


# API routes with versioning prefix
api_router = FastAPI(openapi_prefix=settings.API_PREFIX)


# Graph endpoints
@api_router.get("/graph")
async def get_graph(limit: int = 100) -> Graph:
    """
    Get the entire graph.
    
    Args:
        limit: Maximum number of nodes to retrieve
        
    Returns:
        Graph containing nodes and edges
    """
    try:
        return graph_repository.get_graph(limit)
    except Exception as e:
        logger.error(f"Error getting graph: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting graph: {str(e)}")


@api_router.post("/nodes")
async def create_node(node: Node) -> Node:
    """
    Create a new node.
    
    Args:
        node: Node to create
        
    Returns:
        Created node
    """
    try:
        return graph_repository.create_node(node)
    except Exception as e:
        logger.error(f"Error creating node: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating node: {str(e)}")


@api_router.get("/nodes/{node_id}")
async def get_node(node_id: UUID) -> Node:
    """
    Get a node by ID.
    
    Args:
        node_id: Node ID to retrieve
        
    Returns:
        Node with the specified ID
    """
    try:
        node = graph_repository.get_node_by_id(node_id)
        if not node:
            raise HTTPException(status_code=404, detail=f"Node with ID {node_id} not found")
        return node
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting node: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting node: {str(e)}")


@api_router.put("/nodes/{node_id}")
async def update_node(node_id: UUID, node: Node) -> Node:
    """
    Update a node.
    
    Args:
        node_id: ID of the node to update
        node: Updated node data
        
    Returns:
        Updated node
    """
    if node_id != node.id:
        raise HTTPException(status_code=400, detail="Node ID in URL must match node ID in body")
    
    try:
        return graph_repository.update_node(node)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating node: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating node: {str(e)}")


@api_router.delete("/nodes/{node_id}")
async def delete_node(node_id: UUID) -> Dict[str, bool]:
    """
    Delete a node.
    
    Args:
        node_id: ID of the node to delete
        
    Returns:
        Dictionary with success status
    """
    try:
        success = graph_repository.delete_node(node_id)
        if not success:
            raise HTTPException(status_code=404, detail=f"Node with ID {node_id} not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting node: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting node: {str(e)}")


@api_router.post("/edges")
async def create_edge(edge: Edge) -> Edge:
    """
    Create a new edge.
    
    Args:
        edge: Edge to create
        
    Returns:
        Created edge
    """
    try:
        return graph_repository.create_edge(edge)
    except Exception as e:
        logger.error(f"Error creating edge: {e}")
        raise HTTPException(status_code=500, detail=f"Error creating edge: {str(e)}")


# Mount the API router
app.mount(settings.API_PREFIX, api_router)


if __name__ == "__main__":
    import uvicorn
    
    # Start the API server
    uvicorn.run(
        "src.backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        workers=1,
    )
