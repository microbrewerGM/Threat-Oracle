"""Pydantic v2 schemas for the LLM analysis engine."""
from __future__ import annotations

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class AnalysisTier(str, Enum):
    """Analysis tier controlling model selection and depth."""

    TIER_0 = "tier_0"
    TIER_1 = "tier_1"
    TIER_2 = "tier_2"


class LLMProviderKeys(BaseModel):
    """BYOK provider keys — users supply their own API keys."""

    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    google_api_key: str | None = None
    groq_api_key: str | None = None
    ollama_base_url: str | None = None

    @field_validator(
        "anthropic_api_key",
        "openai_api_key",
        "google_api_key",
        "groq_api_key",
        "ollama_base_url",
        mode="before",
    )
    @classmethod
    def _reject_empty_strings(cls, v: str | None) -> str | None:
        if isinstance(v, str) and v.strip() == "":
            raise ValueError("Key must be a non-empty string when provided")
        return v

    def has_any_key(self) -> bool:
        """Return True if at least one provider key is set."""
        return any(
            getattr(self, f) is not None
            for f in (
                "anthropic_api_key",
                "openai_api_key",
                "google_api_key",
                "groq_api_key",
                "ollama_base_url",
            )
        )

    def available_providers(self) -> list[str]:
        """Return names of providers that have keys configured."""
        mapping = {
            "anthropic_api_key": "anthropic",
            "openai_api_key": "openai",
            "google_api_key": "google",
            "groq_api_key": "groq",
            "ollama_base_url": "ollama",
        }
        return [
            name
            for field, name in mapping.items()
            if getattr(self, field) is not None
        ]


class ThreatFinding(BaseModel):
    """A single threat finding from STRIDE analysis."""

    title: str
    stride_category: Literal[
        "spoofing",
        "tampering",
        "repudiation",
        "information_disclosure",
        "denial_of_service",
        "elevation_of_privilege",
    ]
    severity: Literal["critical", "high", "medium", "low", "info"]
    likelihood: Literal["certain", "likely", "possible", "unlikely", "rare"]
    description: str
    attack_vector: str
    remediation: str
    confidence: float = Field(ge=0.0, le=1.0)
    cwe_ids: list[str] = []
    capec_ids: list[str] = []
    attack_technique_ids: list[str] = []
    affected_assets: list[str] = []


class WorkUnitResult(BaseModel):
    """Result from executing a single work unit."""

    unit_name: str
    phase: int
    data: dict[str, Any]
    tokens_used: int = 0
    duration_seconds: float = 0.0


class AnalysisJobStatus(BaseModel):
    """Status of a running or completed analysis job."""

    job_id: str
    model_id: str
    tier: AnalysisTier
    status: Literal["pending", "running", "completed", "failed"]
    progress_pct: int = Field(default=0, ge=0, le=100)
    current_phase: int | None = None
    units_completed: int = 0
    units_total: int = 0
    threats_found: int = 0
    error: str | None = None
    started_at: str | None = None
    completed_at: str | None = None


class AnalysisResult(BaseModel):
    """Final result of an analysis job."""

    job_id: str
    model_id: str
    tier: AnalysisTier
    findings: list[ThreatFinding]
    work_units: list[WorkUnitResult]
    total_tokens: int = 0
    total_duration_seconds: float = 0.0
