"""Threat Oracle FastAPI application."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from api.config import settings
from api.middleware import (
    AuditLogMiddleware,
    RequestSizeLimitMiddleware,
    SecurityHeadersMiddleware,
)
from api.routes import analysis, graph, health, imports, models
from src.db import close_driver

logger = logging.getLogger("threat_oracle")

# Rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit_default])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle — close Neo4j driver on shutdown."""
    yield
    close_driver()


tags_metadata = [
    {
        "name": "health",
        "description": "Liveness and readiness probes for the API and its backing services.",
    },
    {
        "name": "graph",
        "description": "Browse and search the threat knowledge graph (CWE, ATT&CK, CAPEC).",
    },
    {
        "name": "import",
        "description": "Trigger imports of security knowledge bases into the Neo4j graph.",
    },
    {
        "name": "models",
        "description": "Create, read, update, and delete threat models with their assets.",
    },
    {
        "name": "analysis",
        "description": "Trigger LLM-powered threat analysis and query results.",
    },
]


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    # Conditionally disable docs in production (enable only when debug=True)
    docs_url = "/docs" if settings.debug else None
    redoc_url = "/redoc" if settings.debug else None
    openapi_url = "/openapi.json" if settings.debug else None

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "# Threat Oracle API\n\n"
            "Visual threat modeling powered by a **Neo4j knowledge graph**.\n\n"
            "Threat Oracle ingests security knowledge bases — "
            "[CWE](https://cwe.mitre.org/), "
            "[MITRE ATT&CK](https://attack.mitre.org/), and "
            "[CAPEC](https://capec.mitre.org/) — "
            "and maps them onto application and infrastructure graphs "
            "for automated threat analysis."
        ),
        openapi_tags=tags_metadata,
        lifespan=lifespan,
        docs_url=docs_url,
        redoc_url=redoc_url,
        openapi_url=openapi_url,
    )

    # Rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # Security middleware (order matters — outermost first)
    app.add_middleware(AuditLogMiddleware)
    app.add_middleware(RequestSizeLimitMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)

    # CORS — restrict methods and headers
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Authorization",
            "X-API-Key",
            "X-Requested-With",
            "X-Anthropic-Api-Key",
            "X-OpenAI-Api-Key",
            "X-Google-Api-Key",
            "X-Groq-Api-Key",
            "X-Ollama-Base-Url",
        ],
    )

    # Global exception handler — prevent leaking internal details
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception on %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    app.include_router(health.router)
    app.include_router(graph.router)
    app.include_router(imports.router)
    app.include_router(models.router)
    app.include_router(analysis.router)

    return app


app = create_app()
