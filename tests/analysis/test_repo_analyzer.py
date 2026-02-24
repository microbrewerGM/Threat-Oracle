"""Tests for the repo analyzer module."""

import pytest
from unittest.mock import patch, MagicMock

from analysis.repo_analyzer import (
    parse_github_url,
    analyze_repo,
    _detect_technical_assets,
    _detect_data_assets,
    _infer_trust_boundaries,
    _infer_data_flows,
)


class TestParseGithubUrl:
    def test_https_url(self):
        assert parse_github_url("https://github.com/owner/repo") == ("owner", "repo")

    def test_https_url_trailing_slash(self):
        assert parse_github_url("https://github.com/owner/repo/") == ("owner", "repo")

    def test_https_url_with_git_suffix(self):
        assert parse_github_url("https://github.com/owner/repo.git") == (
            "owner",
            "repo",
        )

    def test_no_scheme(self):
        assert parse_github_url("github.com/owner/repo") == ("owner", "repo")

    def test_ssh_url(self):
        assert parse_github_url("git@github.com:owner/repo.git") == ("owner", "repo")

    def test_ssh_url_no_git(self):
        assert parse_github_url("git@github.com:owner/repo") == ("owner", "repo")

    def test_invalid_url(self):
        with pytest.raises(ValueError, match="Cannot parse GitHub URL"):
            parse_github_url("https://gitlab.com/owner/repo")

    def test_empty_string(self):
        with pytest.raises(ValueError):
            parse_github_url("")


class TestDetectTechnicalAssets:
    def test_dockerfile_detection(self):
        paths = ["Dockerfile", "src/main.py"]
        assets = _detect_technical_assets(paths, {"Python": 1000})
        types = [a["type"] for a in assets]
        assert "container" in types

    def test_frontend_detection(self):
        paths = ["package.json", "src/frontend/App.tsx"]
        assets = _detect_technical_assets(paths, {"TypeScript": 5000})
        names = [a["name"] for a in assets]
        assert "Frontend Application" in names

    def test_python_backend(self):
        paths = ["requirements.txt", "api/main.py"]
        assets = _detect_technical_assets(paths, {"Python": 3000})
        names = [a["name"] for a in assets]
        assert "Python Backend" in names

    def test_java_app(self):
        paths = ["pom.xml", "src/Main.java"]
        assets = _detect_technical_assets(paths, {"Java": 5000})
        names = [a["name"] for a in assets]
        assert "Java Application" in names

    def test_go_app(self):
        paths = ["go.mod", "main.go"]
        assets = _detect_technical_assets(paths, {"Go": 3000})
        names = [a["name"] for a in assets]
        assert "Go Application" in names

    def test_database_detection(self):
        paths = ["alembic/env.py", "alembic/versions/001.py"]
        assets = _detect_technical_assets(paths, {})
        types = [a["type"] for a in assets]
        assert "database" in types

    def test_cloud_infra_terraform(self):
        paths = ["terraform/main.tf", "terraform/variables.tf"]
        assets = _detect_technical_assets(paths, {})
        types = [a["type"] for a in assets]
        assert "service" in types

    def test_api_detection(self):
        paths = ["api/routes/users.py", "api/main.py"]
        assets = _detect_technical_assets(paths, {"Python": 1000})
        types = [a["type"] for a in assets]
        assert "api" in types

    def test_empty_repo(self):
        assets = _detect_technical_assets(["README.md"], {})
        assert assets == []

    def test_nginx_detection(self):
        paths = ["nginx.conf", "index.html"]
        assets = _detect_technical_assets(paths, {})
        types = [a["type"] for a in assets]
        assert "server" in types


class TestDetectDataAssets:
    def test_env_file(self):
        paths = [".env.example", "src/main.py"]
        assets = _detect_data_assets(paths)
        types = [a["type"] for a in assets]
        assert "configuration" in types

    def test_auth_detection(self):
        paths = ["src/auth/login.py", "src/auth/middleware.py"]
        assets = _detect_data_assets(paths)
        types = [a["type"] for a in assets]
        assert "authentication_data" in types

    def test_user_pii(self):
        paths = ["models/user.py", "api/routes.py"]
        assets = _detect_data_assets(paths)
        types = [a["type"] for a in assets]
        assert "pii" in types

    def test_empty_repo(self):
        assets = _detect_data_assets(["README.md"])
        assert assets == []


class TestInferTrustBoundaries:
    def test_frontend_backend_boundary(self):
        tech = [
            {"name": "Frontend Application", "type": "application"},
            {"name": "Python Backend", "type": "application"},
        ]
        boundaries = _infer_trust_boundaries(tech, [])
        names = [b["name"] for b in boundaries]
        assert "Frontend-Backend Boundary" in names

    def test_database_boundary(self):
        tech = [
            {"name": "Python Backend", "type": "application"},
            {"name": "Database", "type": "database"},
        ]
        boundaries = _infer_trust_boundaries(tech, [])
        names = [b["name"] for b in boundaries]
        assert "Application-Database Boundary" in names

    def test_container_boundary(self):
        tech = [{"name": "Container Infrastructure", "type": "container"}]
        boundaries = _infer_trust_boundaries(tech, [])
        names = [b["name"] for b in boundaries]
        assert "Container/Cloud Boundary" in names

    def test_no_boundaries(self):
        boundaries = _infer_trust_boundaries([], [])
        assert boundaries == []


class TestInferDataFlows:
    def test_frontend_to_backend(self):
        tech = [
            {"name": "Frontend Application", "type": "application"},
            {"name": "Python Backend", "type": "application"},
        ]
        flows = _infer_data_flows(tech)
        assert len(flows) >= 1
        assert flows[0]["source"] == "Frontend Application"
        assert flows[0]["protocol"] == "https"

    def test_backend_to_database(self):
        tech = [
            {"name": "Python Backend", "type": "application"},
            {"name": "Database", "type": "database"},
        ]
        flows = _infer_data_flows(tech)
        assert len(flows) >= 1
        assert flows[0]["target"] == "Database"

    def test_no_flows(self):
        flows = _infer_data_flows([])
        assert flows == []


class TestAnalyzeRepo:
    @patch("analysis.repo_analyzer.httpx.Client")
    def test_full_analysis(self, mock_client_cls):
        """Test full analysis with mocked GitHub API responses."""
        mock_client = MagicMock()
        mock_client_cls.return_value.__enter__ = MagicMock(return_value=mock_client)
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)

        # Mock repo metadata
        repo_resp = MagicMock()
        repo_resp.json.return_value = {"default_branch": "main"}

        # Mock languages
        lang_resp = MagicMock()
        lang_resp.json.return_value = {"Python": 5000, "TypeScript": 3000}

        # Mock tree
        tree_resp = MagicMock()
        tree_resp.json.return_value = {
            "tree": [
                {"path": "Dockerfile", "type": "blob"},
                {"path": "requirements.txt", "type": "blob"},
                {"path": "package.json", "type": "blob"},
                {"path": "src/frontend/App.tsx", "type": "blob"},
                {"path": "api/main.py", "type": "blob"},
                {"path": "alembic/env.py", "type": "blob"},
                {"path": ".env.example", "type": "blob"},
            ]
        }

        mock_client.get.side_effect = [repo_resp, lang_resp, tree_resp]

        result = analyze_repo("https://github.com/test/repo")

        assert "technical_assets" in result
        assert "data_assets" in result
        assert "trust_boundaries" in result
        assert "data_flows" in result
        assert "metadata" in result
        assert result["metadata"]["owner"] == "test"
        assert result["metadata"]["repo"] == "repo"
        assert len(result["technical_assets"]) > 0

    @patch("analysis.repo_analyzer.httpx.Client")
    def test_empty_repo(self, mock_client_cls):
        """Test analysis of an empty repo (just README)."""
        mock_client = MagicMock()
        mock_client_cls.return_value.__enter__ = MagicMock(return_value=mock_client)
        mock_client_cls.return_value.__exit__ = MagicMock(return_value=False)

        repo_resp = MagicMock()
        repo_resp.json.return_value = {"default_branch": "main"}

        lang_resp = MagicMock()
        lang_resp.json.return_value = {}

        tree_resp = MagicMock()
        tree_resp.json.return_value = {
            "tree": [{"path": "README.md", "type": "blob"}]
        }

        mock_client.get.side_effect = [repo_resp, lang_resp, tree_resp]

        result = analyze_repo("https://github.com/test/empty-repo")

        assert result["technical_assets"] == []
        assert result["data_assets"] == []
        assert result["trust_boundaries"] == []
        assert result["data_flows"] == []
