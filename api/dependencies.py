"""FastAPI dependencies for dependency injection."""
from typing import Generator

from neo4j import Driver, Session

from src.db import get_driver


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
