"""
Neo4j database client for Threat Oracle.

This module provides a client for connecting to and interacting with Neo4j database.
It includes connection pooling and transaction management.
"""

import logging
from typing import Any, Dict, List, Optional, Union
from neo4j import GraphDatabase, Driver, Session, Result, Transaction
from neo4j.exceptions import Neo4jError, ServiceUnavailable

from src.backend.config import settings

logger = logging.getLogger(__name__)


class Neo4jClient:
    """Neo4j database client with connection pooling and transaction management."""

    def __init__(
        self,
        uri: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
    ):
        """
        Initialize Neo4j client.

        Args:
            uri: Neo4j database URI. Defaults to settings.DATABASE_URL.
            user: Neo4j username. Defaults to settings.DATABASE_USER.
            password: Neo4j password. Defaults to settings.DATABASE_PASSWORD.
        """
        self._uri = uri or settings.DATABASE_URL
        self._user = user or settings.DATABASE_USER
        self._password = password or settings.DATABASE_PASSWORD
        self._driver: Optional[Driver] = None
        self._connect()

    def _connect(self) -> None:
        """Establish connection to Neo4j database."""
        try:
            self._driver = GraphDatabase.driver(
                self._uri, auth=(self._user, self._password)
            )
            # Verify connection
            self._driver.verify_connectivity()
            logger.info(f"Connected to Neo4j database at {self._uri}")
        except ServiceUnavailable as e:
            logger.error(f"Failed to connect to Neo4j database: {e}")
            raise

    def close(self) -> None:
        """Close the database connection."""
        if self._driver:
            self._driver.close()
            logger.info("Closed Neo4j database connection")
            self._driver = None

    def get_session(self) -> Session:
        """
        Get a new session from the driver.

        Returns:
            A new Neo4j session.
        """
        if not self._driver:
            self._connect()
        return self._driver.session()

    def run_query(
        self,
        query: str,
        parameters: Optional[Dict[str, Any]] = None,
        database: Optional[str] = None,
    ) -> Result:
        """
        Run a Cypher query.

        Args:
            query: Cypher query to execute.
            parameters: Query parameters.
            database: Target database name (for multi-database setups).

        Returns:
            Query result.
        """
        with self.get_session() as session:
            try:
                return session.run(query, parameters or {}, database=database)
            except Neo4jError as e:
                logger.error(f"Neo4j query error: {e}")
                raise

    def run_query_in_transaction(
        self,
        tx: Transaction,
        query: str,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> Result:
        """
        Run a Cypher query within an existing transaction.

        Args:
            tx: Active Neo4j transaction.
            query: Cypher query to execute.
            parameters: Query parameters.

        Returns:
            Query result.
        """
        try:
            return tx.run(query, parameters or {})
        except Neo4jError as e:
            logger.error(f"Neo4j transaction query error: {e}")
            raise

    def execute_read_transaction(
        self, func: callable, *args: Any, **kwargs: Any
    ) -> Any:
        """
        Execute read transaction.

        Args:
            func: Function to execute inside the transaction.
            *args: Arguments to pass to the function.
            **kwargs: Keyword arguments to pass to the function.

        Returns:
            Result of the function.
        """
        with self.get_session() as session:
            return session.execute_read(func, *args, **kwargs)

    def execute_write_transaction(
        self, func: callable, *args: Any, **kwargs: Any
    ) -> Any:
        """
        Execute write transaction.

        Args:
            func: Function to execute inside the transaction.
            *args: Arguments to pass to the function.
            **kwargs: Keyword arguments to pass to the function.

        Returns:
            Result of the function.
        """
        with self.get_session() as session:
            return session.execute_write(func, *args, **kwargs)


# Global client instance
neo4j_client = Neo4jClient()
