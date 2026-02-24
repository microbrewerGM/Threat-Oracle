"""API configuration using pydantic-settings."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    app_name: str = "Threat Oracle API"
    app_version: str = "0.1.0"
    debug: bool = False

    neo4j_uri: str = ""
    neo4j_username: str = "neo4j"
    neo4j_password: str = ""

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # API key for import/admin endpoints (set via THREAT_ORACLE_API_KEY env var)
    threat_oracle_api_key: str = ""

    # Rate limiting
    rate_limit_default: str = "60/minute"
    rate_limit_import: str = "5/minute"

    # Request size limit in bytes (default 1MB)
    max_request_size: int = 1_048_576

    model_config = {"env_file": ".env.dev", "env_file_encoding": "utf-8"}


settings = Settings()
