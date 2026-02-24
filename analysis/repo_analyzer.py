"""Repo analyzer — scans a GitHub repository and infers threat model assets."""

from __future__ import annotations

import re
from typing import Any

import httpx


def parse_github_url(url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub URL.

    Supports:
        https://github.com/owner/repo
        https://github.com/owner/repo.git
        github.com/owner/repo
        git@github.com:owner/repo.git
    """
    # SSH format
    ssh_match = re.match(r"git@github\.com:([^/]+)/([^/.]+?)(?:\.git)?$", url)
    if ssh_match:
        return ssh_match.group(1), ssh_match.group(2)

    # HTTPS format
    https_match = re.match(
        r"(?:https?://)?github\.com/([^/]+)/([^/.]+?)(?:\.git)?/?$", url
    )
    if https_match:
        return https_match.group(1), https_match.group(2)

    raise ValueError(f"Cannot parse GitHub URL: {url}")


def _detect_technical_assets(
    tree_paths: list[str], languages: dict[str, int]
) -> list[dict[str, Any]]:
    """Detect technical assets from file tree and language breakdown."""
    assets: list[dict[str, Any]] = []
    seen_types: set[str] = set()

    # Container detection
    container_files = {
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
        "docker-compose.dev.yml",
        "docker-compose.prod.yml",
    }
    if any(
        p.split("/")[-1] in container_files or p.endswith("Dockerfile")
        for p in tree_paths
    ):
        assets.append(
            {
                "name": "Container Infrastructure",
                "type": "container",
                "description": "Docker containerization detected",
            }
        )
        seen_types.add("container")

    # Frontend detection
    frontend_indicators = {"package.json"}
    frontend_frameworks = {"TypeScript", "JavaScript"}
    has_frontend_files = any(
        p.split("/")[-1] in frontend_indicators for p in tree_paths
    )
    has_frontend_dirs = any(
        p.startswith(("src/frontend/", "frontend/", "client/", "web/", "app/src/"))
        for p in tree_paths
    )
    if has_frontend_files and (
        has_frontend_dirs or frontend_frameworks & set(languages.keys())
    ):
        assets.append(
            {
                "name": "Frontend Application",
                "type": "application",
                "description": "Web frontend detected",
            }
        )
        seen_types.add("frontend")

    # Python backend
    python_indicators = {"requirements.txt", "pyproject.toml", "setup.py", "Pipfile"}
    if (
        any(p.split("/")[-1] in python_indicators for p in tree_paths)
        or "Python" in languages
    ):
        assets.append(
            {
                "name": "Python Backend",
                "type": "application",
                "description": "Python application detected",
            }
        )
        seen_types.add("python")

    # Java app
    java_indicators = {"pom.xml", "build.gradle", "build.gradle.kts"}
    if (
        any(p.split("/")[-1] in java_indicators for p in tree_paths)
        or "Java" in languages
    ):
        assets.append(
            {
                "name": "Java Application",
                "type": "application",
                "description": "Java application detected",
            }
        )
        seen_types.add("java")

    # Go app
    if (
        any(p.split("/")[-1] == "go.mod" for p in tree_paths) or "Go" in languages
    ):
        assets.append(
            {
                "name": "Go Application",
                "type": "application",
                "description": "Go application detected",
            }
        )
        seen_types.add("go")

    # Web server
    server_configs = {"nginx.conf", "httpd.conf", "apache2.conf"}
    if any(p.split("/")[-1] in server_configs for p in tree_paths):
        assets.append(
            {
                "name": "Web Server",
                "type": "server",
                "description": "Web server configuration detected",
            }
        )
        seen_types.add("server")

    # Database
    db_indicators = {
        "prisma/",
        "migrations/",
        "alembic/",
        "alembic.ini",
        "knexfile",
    }
    if any(
        any(
            p.startswith(d) or p.split("/")[-1] == d.rstrip("/")
            for d in db_indicators
        )
        for p in tree_paths
    ):
        assets.append(
            {
                "name": "Database",
                "type": "database",
                "description": "Database migrations or ORM detected",
            }
        )
        seen_types.add("database")

    # Cloud infrastructure
    cloud_indicators = {
        "serverless.yml",
        "serverless.yaml",
        "cdk.json",
        "cdk.out/",
        "template.yaml",
        "template.yml",
    }
    terraform_dirs = any(
        p.startswith("terraform/") or p.endswith(".tf") for p in tree_paths
    )
    if (
        any(p.split("/")[-1] in cloud_indicators for p in tree_paths)
        or terraform_dirs
    ):
        assets.append(
            {
                "name": "Cloud Infrastructure",
                "type": "service",
                "description": "Infrastructure-as-Code detected",
            }
        )
        seen_types.add("cloud")

    # API
    api_indicators = {
        "openapi.yaml",
        "openapi.yml",
        "openapi.json",
        "swagger.yaml",
        "swagger.json",
    }
    has_api_dirs = any(
        p.startswith(("api/", "routes/", "endpoints/")) for p in tree_paths
    )
    if any(p.split("/")[-1] in api_indicators for p in tree_paths) or has_api_dirs:
        assets.append(
            {
                "name": "API Service",
                "type": "api",
                "description": "API endpoints detected",
            }
        )
        seen_types.add("api")

    return assets


def _detect_data_assets(tree_paths: list[str]) -> list[dict[str, Any]]:
    """Detect data assets from file tree."""
    assets: list[dict[str, Any]] = []

    # Configuration / secrets
    env_files = {".env", ".env.example", ".env.sample", ".env.dev", ".env.production"}
    if any(p.split("/")[-1] in env_files for p in tree_paths):
        assets.append(
            {
                "name": "Environment Configuration",
                "type": "configuration",
                "classification": "confidential",
                "description": "Environment variables / secrets detected",
            }
        )

    # Auth patterns
    auth_dirs = any(
        p.startswith(("auth/", "authentication/", "src/auth/")) for p in tree_paths
    )
    auth_files = any("auth" in p.split("/")[-1].lower() for p in tree_paths)
    if auth_dirs or auth_files:
        assets.append(
            {
                "name": "Authentication Data",
                "type": "authentication_data",
                "classification": "confidential",
                "description": "Authentication module detected",
            }
        )

    # User / PII
    user_patterns = any(
        re.search(r"(user|account|profile|customer)", p.split("/")[-1].lower())
        for p in tree_paths
        if p.endswith((".py", ".ts", ".js", ".java", ".go"))
    )
    migration_user = any(
        "user" in p.lower() for p in tree_paths if "migration" in p.lower()
    )
    if user_patterns or migration_user:
        assets.append(
            {
                "name": "User / PII Data",
                "type": "pii",
                "classification": "confidential",
                "description": "User data models detected",
            }
        )

    return assets


def _infer_trust_boundaries(
    tech_assets: list[dict], data_assets: list[dict]
) -> list[dict[str, Any]]:
    """Infer trust boundaries from detected assets."""
    boundaries: list[dict[str, Any]] = []
    asset_types = {a["type"] for a in tech_assets}

    has_frontend = "application" in asset_types and any(
        "Frontend" in a["name"] for a in tech_assets
    )
    has_backend = "application" in asset_types and any(
        a["name"] not in ("Frontend Application",)
        for a in tech_assets
        if a["type"] == "application"
    )
    has_database = "database" in asset_types
    has_container = "container" in asset_types
    has_cloud = "service" in asset_types

    if has_frontend and has_backend:
        boundaries.append(
            {
                "name": "Frontend-Backend Boundary",
                "type": "network",
                "description": "Trust boundary between client-side frontend and server-side backend",
            }
        )

    if has_database:
        boundaries.append(
            {
                "name": "Application-Database Boundary",
                "type": "network",
                "description": "Trust boundary between application logic and data storage",
            }
        )

    if has_container or has_cloud:
        boundaries.append(
            {
                "name": "Container/Cloud Boundary",
                "type": "network",
                "description": "Trust boundary at infrastructure/deployment layer",
            }
        )

    return boundaries


def _infer_data_flows(tech_assets: list[dict]) -> list[dict[str, Any]]:
    """Infer data flows from detected assets."""
    flows: list[dict[str, Any]] = []
    asset_types = {a["type"] for a in tech_assets}
    asset_names = {a["name"] for a in tech_assets}

    has_frontend = any("Frontend" in n for n in asset_names)
    backend_names = [
        a["name"]
        for a in tech_assets
        if a["type"] == "application" and "Frontend" not in a["name"]
    ]
    has_database = "database" in asset_types

    if has_frontend and backend_names:
        flows.append(
            {
                "name": f"Frontend to {backend_names[0]}",
                "source": "Frontend Application",
                "target": backend_names[0],
                "protocol": "https",
                "description": "Client-server communication",
            }
        )

    if backend_names and has_database:
        flows.append(
            {
                "name": f"{backend_names[0]} to Database",
                "source": backend_names[0],
                "target": "Database",
                "protocol": "tcp",
                "description": "Application-database queries",
            }
        )

    return flows


def analyze_repo(repo_url: str) -> dict[str, Any]:
    """Analyze a GitHub repository and return inferred threat model structure.

    Args:
        repo_url: GitHub repository URL.

    Returns:
        Dict with technical_assets, data_assets, trust_boundaries, data_flows, metadata.
    """
    owner, repo = parse_github_url(repo_url)
    base = f"https://api.github.com/repos/{owner}/{repo}"

    with httpx.Client(
        timeout=30, headers={"Accept": "application/vnd.github.v3+json"}
    ) as client:
        # Repo metadata
        resp = client.get(base)
        resp.raise_for_status()
        repo_meta = resp.json()
        default_branch = repo_meta.get("default_branch", "main")

        # Languages
        resp = client.get(f"{base}/languages")
        resp.raise_for_status()
        languages: dict[str, int] = resp.json()

        # File tree
        resp = client.get(
            f"{base}/git/trees/{default_branch}", params={"recursive": "1"}
        )
        resp.raise_for_status()
        tree_data = resp.json()
        tree_paths = [
            item["path"]
            for item in tree_data.get("tree", [])
            if item.get("type") in ("blob", "tree")
        ]

    tech_assets = _detect_technical_assets(tree_paths, languages)
    data_assets = _detect_data_assets(tree_paths)
    trust_boundaries = _infer_trust_boundaries(tech_assets, data_assets)
    data_flows = _infer_data_flows(tech_assets)

    return {
        "technical_assets": tech_assets,
        "data_assets": data_assets,
        "trust_boundaries": trust_boundaries,
        "data_flows": data_flows,
        "metadata": {
            "repo_url": repo_url,
            "owner": owner,
            "repo": repo,
            "default_branch": default_branch,
            "languages": languages,
            "total_files": len(
                [p for p in tree_paths if "/" in p or "." in p]
            ),
        },
    }
