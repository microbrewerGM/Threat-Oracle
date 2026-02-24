"""Prompt builders for Phase 3: Threat analysis work units."""
from __future__ import annotations

import json
from typing import Any

SYSTEM_MSG = (
    "You are an expert threat modeler performing STRIDE-based threat analysis. "
    "Use the provided architecture data and security knowledge bases to identify "
    "threats. Return ONLY valid JSON."
)

THREAT_FINDING_SCHEMA = (
    '{"title": str, "stride_category": "spoofing"|"tampering"|"repudiation"'
    '|"information_disclosure"|"denial_of_service"|"elevation_of_privilege", '
    '"severity": "critical"|"high"|"medium"|"low"|"info", '
    '"likelihood": "certain"|"likely"|"possible"|"unlikely"|"rare", '
    '"description": str, "attack_vector": str, "remediation": str, '
    '"confidence": float(0-1), "cwe_ids": [str], "capec_ids": [str], '
    '"attack_technique_ids": [str], "affected_assets": [str]}'
)


def _prior_data(prior_results: dict, *keys: str) -> str:
    """Extract data from prior work unit results for prompt context."""
    sections = []
    for key in keys:
        result = prior_results.get(key)
        if result:
            sections.append(f"## {key}\n{json.dumps(result.data, indent=2)}")
    return "\n\n".join(sections) if sections else "(no prior data)"


def _build_stride_analysis_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "data_flows", "auth_flows")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Perform a STRIDE threat analysis on each component and data "
                "flow. For every identified threat, provide a complete finding.\n\n"
                f"Architecture analysis:\n{context}\n\n"
                "Return JSON with: "
                f'{{"findings": [{THREAT_FINDING_SCHEMA}, ...]}}'
            ),
        },
    ]


def _build_cwe_mapping_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "stride_analysis")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Map each threat finding to relevant CWE (Common Weakness "
                "Enumeration) entries. Reference the CWE knowledge base for "
                "accurate mappings.\n\n"
                f"Findings:\n{context}\n\n"
                "Return JSON with: "
                '{"mappings": {"<finding_index_or_title>": '
                '{"cwe_ids": ["CWE-XXX", ...], "rationale": str}, ...}}'
            ),
        },
    ]


def _build_attack_mapping_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "stride_analysis")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Map each threat finding to relevant MITRE ATT&CK techniques "
                "and CAPEC attack patterns.\n\n"
                f"Findings:\n{context}\n\n"
                "Return JSON with: "
                '{"mappings": {"<finding_index_or_title>": '
                '{"technique_ids": ["T1XXX", ...], '
                '"capec_ids": ["CAPEC-XXX", ...], '
                '"rationale": str}, ...}}'
            ),
        },
    ]


def _build_risk_scoring_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "cwe_mapping", "attack_mapping")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Calculate risk scores for each finding based on severity, "
                "likelihood, attack complexity, and potential impact. Use a "
                "consistent scoring methodology.\n\n"
                f"Mapped findings:\n{context}\n\n"
                "Return JSON with: "
                '{"scores": [{"finding_title": str, '
                '"risk_score": float(0-10), '
                '"attack_complexity": "low"|"medium"|"high", '
                '"impact": "low"|"medium"|"high"|"critical", '
                '"priority": int}], "methodology": str}'
            ),
        },
    ]


def _build_remediation_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "risk_scoring")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Generate actionable remediation recommendations for each "
                "finding, prioritized by risk score. Include specific code "
                "changes, configuration fixes, and architectural improvements.\n\n"
                f"Scored findings:\n{context}\n\n"
                "Return JSON with: "
                '{"recommendations": [{"finding_title": str, '
                '"priority": int, '
                '"short_term": [str], "long_term": [str], '
                '"references": [str]}], "summary": str}'
            ),
        },
    ]


PHASE3_BUILDERS = {
    "stride_analysis": _build_stride_analysis_prompt,
    "cwe_mapping": _build_cwe_mapping_prompt,
    "attack_mapping": _build_attack_mapping_prompt,
    "risk_scoring": _build_risk_scoring_prompt,
    "remediation": _build_remediation_prompt,
}
