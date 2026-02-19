"""Health check endpoints."""
from fastapi import APIRouter, Depends
from neo4j import Driver

from api.dependencies import get_neo4j_driver

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    """Basic health check — returns OK if the API is running."""
    return {"status": "ok"}


@router.get("/health/db")
def db_health_check(driver: Driver = Depends(get_neo4j_driver)):
    """Database health check — verifies Neo4j connectivity."""
    try:
        driver.verify_connectivity()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": "disconnected", "error": str(e)}
