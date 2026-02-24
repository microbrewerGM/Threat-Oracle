"""Prompt builders for Phase 2: Architecture analysis work units."""
from __future__ import annotations

import json
from typing import Any

SYSTEM_MSG = (
    "You are a security architect analyzing an application's architecture. "
    "Use the provided analysis data to identify architectural security properties. "
    "Return ONLY valid JSON."
)


def _prior_data(prior_results: dict, *keys: str) -> str:
    """Extract data from prior work unit results for prompt context."""
    sections = []
    for key in keys:
        result = prior_results.get(key)
        if result:
            sections.append(f"## {key}\n{json.dumps(result.data, indent=2)}")
    return "\n\n".join(sections) if sections else "(no prior data)"


def _build_api_endpoints_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "file_tree", "frameworks")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Map all API endpoints, their HTTP methods, authentication "
                "requirements, and input validation.\n\n"
                f"Prior analysis:\n{context}\n\n"
                f"Source files:\n{json.dumps(model_data.get('source_snippets', {}), indent=2)}\n\n"
                "Return JSON with: "
                '{"endpoints": [{"path": str, "method": str, '
                '"auth_required": bool, "input_validation": str, '
                '"risk_notes": str}], "summary": str}'
            ),
        },
    ]


def _build_auth_flows_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "api_endpoints")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Trace authentication and authorization flows. Identify auth "
                "mechanisms (JWT, OAuth, session, API key), privilege levels, "
                "and potential bypass vectors.\n\n"
                f"Prior analysis:\n{context}\n\n"
                f"Auth-related files:\n{json.dumps(model_data.get('auth_files', {}), indent=2)}\n\n"
                "Return JSON with: "
                '{"auth_mechanisms": [{"type": str, "implementation": str, '
                '"strengths": [str], "weaknesses": [str]}], '
                '"privilege_levels": [str], "summary": str}'
            ),
        },
    ]


def _build_trust_boundaries_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(prior_results, "api_endpoints", "data_stores")
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Identify trust boundaries between components. Mark where "
                "data crosses trust levels (user→server, server→database, "
                "service→service, etc.).\n\n"
                f"Prior analysis:\n{context}\n\n"
                "Return JSON with: "
                '{"boundaries": [{"name": str, "from_zone": str, '
                '"to_zone": str, "protocol": str, '
                '"data_sensitivity": "high"|"medium"|"low"}], '
                '"zones": [{"name": str, "trust_level": int}], '
                '"summary": str}'
            ),
        },
    ]


def _build_data_flows_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    context = _prior_data(
        prior_results, "api_endpoints", "trust_boundaries"
    )
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Map data flows between components. For each flow, identify "
                "source, destination, data type, sensitivity, and whether "
                "encryption is applied.\n\n"
                f"Prior analysis:\n{context}\n\n"
                "Return JSON with: "
                '{"flows": [{"source": str, "destination": str, '
                '"data_type": str, "sensitivity": "high"|"medium"|"low", '
                '"encrypted": bool, "crosses_boundary": bool}], '
                '"summary": str}'
            ),
        },
    ]


PHASE2_BUILDERS = {
    "api_endpoints": _build_api_endpoints_prompt,
    "auth_flows": _build_auth_flows_prompt,
    "trust_boundaries": _build_trust_boundaries_prompt,
    "data_flows": _build_data_flows_prompt,
}
