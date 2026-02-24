"""Tests for analysis.llm.schemas."""
import pytest
from pydantic import ValidationError

from analysis.llm.schemas import (
    AnalysisJobStatus,
    AnalysisResult,
    AnalysisTier,
    LLMProviderKeys,
    ThreatFinding,
    WorkUnitResult,
)


class TestAnalysisTier:
    def test_tier_values(self):
        assert AnalysisTier.TIER_0 == "tier_0"
        assert AnalysisTier.TIER_1 == "tier_1"
        assert AnalysisTier.TIER_2 == "tier_2"

    def test_tier_from_value(self):
        assert AnalysisTier("tier_1") == AnalysisTier.TIER_1


class TestLLMProviderKeys:
    def test_no_keys(self):
        keys = LLMProviderKeys()
        assert keys.has_any_key() is False
        assert keys.available_providers() == []

    def test_single_key(self):
        keys = LLMProviderKeys(anthropic_api_key="sk-test")
        assert keys.has_any_key() is True
        assert keys.available_providers() == ["anthropic"]

    def test_multiple_keys(self):
        keys = LLMProviderKeys(
            anthropic_api_key="sk-ant",
            groq_api_key="gsk-test",
        )
        assert keys.has_any_key() is True
        providers = keys.available_providers()
        assert "anthropic" in providers
        assert "groq" in providers
        assert len(providers) == 2

    def test_ollama_url(self):
        keys = LLMProviderKeys(ollama_base_url="http://localhost:11434")
        assert keys.has_any_key() is True
        assert keys.available_providers() == ["ollama"]

    def test_empty_string_rejected(self):
        with pytest.raises(ValidationError, match="non-empty string"):
            LLMProviderKeys(anthropic_api_key="")

    def test_whitespace_only_rejected(self):
        with pytest.raises(ValidationError, match="non-empty string"):
            LLMProviderKeys(openai_api_key="   ")


class TestThreatFinding:
    def test_valid_finding(self):
        finding = ThreatFinding(
            title="SQL Injection in user search",
            stride_category="tampering",
            severity="high",
            likelihood="likely",
            description="User input is concatenated into SQL queries.",
            attack_vector="Web form input field",
            remediation="Use parameterized queries.",
            confidence=0.85,
            cwe_ids=["CWE-89"],
            affected_assets=["user_search_endpoint"],
        )
        assert finding.title == "SQL Injection in user search"
        assert finding.confidence == 0.85

    def test_confidence_too_high(self):
        with pytest.raises(ValidationError):
            ThreatFinding(
                title="Test",
                stride_category="spoofing",
                severity="low",
                likelihood="rare",
                description="desc",
                attack_vector="vec",
                remediation="rem",
                confidence=1.5,
            )

    def test_confidence_too_low(self):
        with pytest.raises(ValidationError):
            ThreatFinding(
                title="Test",
                stride_category="spoofing",
                severity="low",
                likelihood="rare",
                description="desc",
                attack_vector="vec",
                remediation="rem",
                confidence=-0.1,
            )

    def test_invalid_stride_category(self):
        with pytest.raises(ValidationError):
            ThreatFinding(
                title="Test",
                stride_category="invalid_category",
                severity="low",
                likelihood="rare",
                description="desc",
                attack_vector="vec",
                remediation="rem",
                confidence=0.5,
            )

    def test_default_empty_lists(self):
        finding = ThreatFinding(
            title="Test",
            stride_category="repudiation",
            severity="info",
            likelihood="unlikely",
            description="desc",
            attack_vector="vec",
            remediation="rem",
            confidence=0.5,
        )
        assert finding.cwe_ids == []
        assert finding.capec_ids == []
        assert finding.attack_technique_ids == []
        assert finding.affected_assets == []


class TestAnalysisJobStatus:
    def test_valid_status(self):
        status = AnalysisJobStatus(
            job_id="job-abc123",
            model_id="model-1",
            tier=AnalysisTier.TIER_1,
            status="pending",
            progress_pct=0,
        )
        assert status.status == "pending"
        assert status.progress_pct == 0

    def test_progress_pct_max(self):
        with pytest.raises(ValidationError):
            AnalysisJobStatus(
                job_id="job-abc",
                model_id="m1",
                tier=AnalysisTier.TIER_0,
                status="running",
                progress_pct=101,
            )

    def test_progress_pct_min(self):
        with pytest.raises(ValidationError):
            AnalysisJobStatus(
                job_id="job-abc",
                model_id="m1",
                tier=AnalysisTier.TIER_0,
                status="running",
                progress_pct=-1,
            )


class TestWorkUnitResult:
    def test_valid_result(self):
        result = WorkUnitResult(
            unit_name="file_tree",
            phase=1,
            data={"categories": {}},
            tokens_used=150,
            duration_seconds=2.5,
        )
        assert result.unit_name == "file_tree"
        assert result.tokens_used == 150


class TestAnalysisResult:
    def test_valid_result(self):
        result = AnalysisResult(
            job_id="job-abc",
            model_id="model-1",
            tier=AnalysisTier.TIER_1,
            findings=[],
            work_units=[],
        )
        assert result.total_tokens == 0
        assert result.findings == []
