"""
Configuration settings for the Threat Oracle backend.

This module loads environment variables and provides configuration settings
for database connections, API settings, and other backend configurations.
"""

import os
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database settings
    DATABASE_URL: str = Field(
        default="neo4j://localhost:7687", 
        description="Neo4j database connection URL"
    )
    DATABASE_USER: str = Field(
        default="neo4j", 
        description="Neo4j database username"
    )
    DATABASE_PASSWORD: str = Field(
        default="password", 
        description="Neo4j database password"
    )
    
    # API settings
    API_PREFIX: str = Field(
        default="/api/v1", 
        description="API route prefix"
    )
    
    # Logging settings
    LOG_LEVEL: str = Field(
        default="INFO", 
        description="Logging level"
    )
    
    # CORS settings
    CORS_ORIGINS: list[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"], 
        description="Allowed CORS origins"
    )
    
    class Config:
        """Pydantic config for settings."""
        
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()
