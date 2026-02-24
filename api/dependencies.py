"""FastAPI dependencies for dependency injection."""
import threading
from typing import Generator

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from neo4j import Driver, Session

from api.config import settings
from src.db import get_driver

# API key header scheme
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Import concurrency lock — only one import at a time
import_lock = threading.Lock()


def get_neo4j_driver() -> Driver:
    """Dependency that provides the Neo4j driver."""
    return get_driver()


def get_neo4j_session() -> Generator[Session, None, None]:
    """Dependency that provides a Neo4j session, auto-closed after request."""
    driver = get_driver()
    session = driver.session()
    try:
        yield session
    finally:
        session.close()


def require_api_key(api_key: str = Security(_api_key_header)) -> str:
    """Dependency that validates the API key for protected endpoints."""
    if not settings.threat_oracle_api_key:
        # No API key configured — skip auth (dev mode)
        return ""
    if not api_key or api_key != settings.threat_oracle_api_key:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return api_key
