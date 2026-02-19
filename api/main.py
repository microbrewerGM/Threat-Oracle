"""Threat Oracle FastAPI application."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import settings
from api.routes import health, graph, imports
from src.db import close_driver


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle — close Neo4j driver on shutdown."""
    yield
    close_driver()


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Visual threat modeling API powered by a Neo4j knowledge graph.",
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

    return app


app = create_app()
