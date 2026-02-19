"""Shared Neo4j driver module for Threat Oracle.

Provides a singleton Neo4j driver with connection pooling, configured
from environment variables. Used by both the API layer and importers.
"""
import os
from contextlib import contextmanager
from typing import Optional

from neo4j import GraphDatabase, Driver


_driver: Optional[Driver] = None


def get_neo4j_config() -> dict:
    """Read Neo4j connection config from environment variables."""
    uri = os.environ.get("NEO4J_URI", "")
    username = os.environ.get("NEO4J_USERNAME", "neo4j")
    password = os.environ.get("NEO4J_PASSWORD", "")
    return {"uri": uri, "username": username, "password": password}


def get_driver() -> Driver:
    """Get or create the singleton Neo4j driver.

    Raises ValueError if NEO4J_URI or NEO4J_PASSWORD are not set.
    """
    global _driver
    if _driver is not None:
        return _driver

    config = get_neo4j_config()
    if not config["uri"] or not config["password"]:
        raise ValueError(
            "NEO4J_URI and NEO4J_PASSWORD environment variables are required"
        )

    _driver = GraphDatabase.driver(
        config["uri"],
        auth=(config["username"], config["password"]),
    )
    return _driver


def close_driver() -> None:
    """Close the singleton driver if it exists."""
    global _driver
    if _driver is not None:
        _driver.close()
        _driver = None


@contextmanager
def get_session():
    """Context manager that yields a Neo4j session from the singleton driver."""
    driver = get_driver()
    session = driver.session()
    try:
        yield session
    finally:
        session.close()


def verify_connectivity() -> bool:
    """Verify the Neo4j connection is working. Returns True on success."""
    driver = get_driver()
    driver.verify_connectivity()
    return True
