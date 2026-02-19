"""Threat Oracle FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.routes import health, graph, imports, models
from src.db import close_driver


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
]


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
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
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(graph.router)
    app.include_router(imports.router)
    app.include_router(models.router)

    return app


app = create_app()
