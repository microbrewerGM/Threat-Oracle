"""Tests for LLM prompt builders — all phases."""
import pytest
from unittest.mock import MagicMock

from analysis.llm.prompts import get_prompt_builder
from analysis.llm.prompts.phase1_extraction import PHASE1_BUILDERS
from analysis.llm.prompts.phase2_architecture import PHASE2_BUILDERS
from analysis.llm.prompts.phase3_threats import PHASE3_BUILDERS


SAMPLE_MODEL_DATA = {
    "file_tree": ["src/main.py", "requirements.txt", "Dockerfile"],
    "dependencies": {"requirements.txt": ["fastapi", "neo4j"]},
    "config_files": {"docker-compose.yml": "version: '3'"},
    "source_snippets": {"src/main.py": "app = FastAPI()"},
    "auth_files": {"src/auth.py": "def verify_token(): ..."},
}


def _make_prior_result(data: dict):
    """Create a mock WorkUnitResult with a .data attribute."""
    result = MagicMock()
    result.data = data
    return result


class TestGetPromptBuilder:
    """Tests for the get_prompt_builder dispatcher."""

    def test_raises_for_unknown_unit(self):
        with pytest.raises(ValueError, match="No prompt builder"):
            get_prompt_builder("nonexistent_unit")

    def test_returns_callable_for_known_phase1(self):
        builder = get_prompt_builder("file_tree")
        assert callable(builder)

    def test_returns_callable_for_known_phase2(self):
        builder = get_prompt_builder("api_endpoints")
        assert callable(builder)

    def test_returns_callable_for_known_phase3(self):
        builder = get_prompt_builder("stride_analysis")
        assert callable(builder)


class TestPhase1Builders:
    """Tests for phase 1 extraction prompt builders."""

    @pytest.mark.parametrize("unit_name", list(PHASE1_BUILDERS.keys()))
    def test_returns_list_of_role_content_dicts(self, unit_name):
        builder = PHASE1_BUILDERS[unit_name]
        messages = builder(SAMPLE_MODEL_DATA, {})
        assert isinstance(messages, list)
        assert len(messages) >= 2
        for msg in messages:
            assert "role" in msg
            assert "content" in msg
            assert msg["role"] in ("system", "user")

    @pytest.mark.parametrize("unit_name", list(PHASE1_BUILDERS.keys()))
    def test_system_message_is_first(self, unit_name):
        builder = PHASE1_BUILDERS[unit_name]
        messages = builder(SAMPLE_MODEL_DATA, {})
        assert messages[0]["role"] == "system"

    def test_file_tree_includes_model_data(self):
        builder = PHASE1_BUILDERS["file_tree"]
        messages = builder(SAMPLE_MODEL_DATA, {})
        user_msg = messages[-1]["content"]
        assert "src/main.py" in user_msg

    def test_dependencies_includes_model_data(self):
        builder = PHASE1_BUILDERS["dependencies"]
        messages = builder(SAMPLE_MODEL_DATA, {})
        user_msg = messages[-1]["content"]
        assert "fastapi" in user_msg

    def test_data_stores_includes_config(self):
        builder = PHASE1_BUILDERS["data_stores"]
        messages = builder(SAMPLE_MODEL_DATA, {})
        user_msg = messages[-1]["content"]
        assert "docker-compose" in user_msg


class TestPhase2Builders:
    """Tests for phase 2 architecture prompt builders."""

    @pytest.mark.parametrize("unit_name", list(PHASE2_BUILDERS.keys()))
    def test_returns_list_of_role_content_dicts(self, unit_name):
        prior = {
            "file_tree": _make_prior_result({"categories": {}}),
            "frameworks": _make_prior_result({"frameworks": []}),
            "api_endpoints": _make_prior_result({"endpoints": []}),
            "data_stores": _make_prior_result({"data_stores": []}),
            "trust_boundaries": _make_prior_result({"boundaries": []}),
        }
        builder = PHASE2_BUILDERS[unit_name]
        messages = builder(SAMPLE_MODEL_DATA, prior)
        assert isinstance(messages, list)
        assert len(messages) >= 2
        for msg in messages:
            assert "role" in msg
            assert "content" in msg

    def test_api_endpoints_includes_prior_data(self):
        prior = {
            "file_tree": _make_prior_result({"categories": {"source_code": ["main.py"]}}),
            "frameworks": _make_prior_result({"frameworks": [{"name": "FastAPI"}]}),
        }
        builder = PHASE2_BUILDERS["api_endpoints"]
        messages = builder(SAMPLE_MODEL_DATA, prior)
        user_msg = messages[-1]["content"]
        assert "file_tree" in user_msg
        assert "FastAPI" in user_msg

    def test_phase2_with_no_prior_data(self):
        builder = PHASE2_BUILDERS["api_endpoints"]
        messages = builder(SAMPLE_MODEL_DATA, {})
        user_msg = messages[-1]["content"]
        assert "no prior data" in user_msg


class TestPhase3Builders:
    """Tests for phase 3 threat analysis prompt builders."""

    @pytest.mark.parametrize("unit_name", list(PHASE3_BUILDERS.keys()))
    def test_returns_list_of_role_content_dicts(self, unit_name):
        prior = {
            "data_flows": _make_prior_result({"flows": []}),
            "auth_flows": _make_prior_result({"auth_mechanisms": []}),
            "stride_analysis": _make_prior_result({"findings": []}),
            "cwe_mapping": _make_prior_result({"mappings": {}}),
            "attack_mapping": _make_prior_result({"mappings": {}}),
            "risk_scoring": _make_prior_result({"scores": []}),
        }
        builder = PHASE3_BUILDERS[unit_name]
        messages = builder(SAMPLE_MODEL_DATA, prior)
        assert isinstance(messages, list)
        assert len(messages) >= 2
        for msg in messages:
            assert "role" in msg
            assert "content" in msg

    def test_stride_system_msg_mentions_threat(self):
        builder = PHASE3_BUILDERS["stride_analysis"]
        messages = builder(SAMPLE_MODEL_DATA, {})
        sys_msg = messages[0]["content"]
        assert "threat" in sys_msg.lower()

    def test_remediation_includes_prior_scoring(self):
        prior = {
            "risk_scoring": _make_prior_result(
                {"scores": [{"finding_title": "SQLi", "risk_score": 9.0}]}
            ),
        }
        builder = PHASE3_BUILDERS["remediation"]
        messages = builder(SAMPLE_MODEL_DATA, prior)
        user_msg = messages[-1]["content"]
        assert "SQLi" in user_msg
