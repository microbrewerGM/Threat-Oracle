"""Prompt builders for Phase 1: Extraction work units."""
from __future__ import annotations

import json
from typing import Any

SYSTEM_MSG = (
    "You are a security-focused software analyst. "
    "Analyze the provided repository data and return ONLY valid JSON."
)


def _build_file_tree_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    tree = json.dumps(model_data.get("file_tree", []), indent=2)
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Analyze this repository file tree and categorize files by "
                "security relevance.\n\n"
                f"File tree:\n{tree}\n\n"
                "Return JSON with: "
                '{"categories": {"source_code": [...], "configuration": [...], '
                '"infrastructure": [...], "secrets_risk": [...], '
                '"test_files": [...]}, "summary": "<string>"}'
            ),
        },
    ]


def _build_dependencies_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    deps = json.dumps(model_data.get("dependencies", {}), indent=2)
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Analyze these dependency manifests for security implications. "
                "Identify outdated packages, known-vulnerable libraries, and "
                "risky transitive dependencies.\n\n"
                f"Dependencies:\n{deps}\n\n"
                "Return JSON with: "
                '{"packages": [{"name": str, "version": str, "ecosystem": str, '
                '"risk_level": "high"|"medium"|"low"|"none", '
                '"notes": str}], "summary": str}'
            ),
        },
    ]


def _build_frameworks_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    file_tree = json.dumps(model_data.get("file_tree", []), indent=2)
    deps = json.dumps(model_data.get("dependencies", {}), indent=2)
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Identify all frameworks and libraries in use based on the "
                "file tree and dependency manifests. Classify each by type "
                "(web framework, ORM, auth library, etc.).\n\n"
                f"File tree:\n{file_tree}\n\n"
                f"Dependencies:\n{deps}\n\n"
                "Return JSON with: "
                '{"frameworks": [{"name": str, "type": str, '
                '"version": str|null, "security_notes": str}], '
                '"summary": str}'
            ),
        },
    ]


def _build_data_stores_prompt(
    model_data: dict[str, Any], prior_results: dict
) -> list[dict[str, str]]:
    file_tree = json.dumps(model_data.get("file_tree", []), indent=2)
    deps = json.dumps(model_data.get("dependencies", {}), indent=2)
    config = json.dumps(model_data.get("config_files", {}), indent=2)
    return [
        {"role": "system", "content": SYSTEM_MSG},
        {
            "role": "user",
            "content": (
                "Detect all database engines, caches, message queues, and "
                "storage services used in this project.\n\n"
                f"File tree:\n{file_tree}\n\n"
                f"Dependencies:\n{deps}\n\n"
                f"Configuration files:\n{config}\n\n"
                "Return JSON with: "
                '{"data_stores": [{"name": str, "type": '
                '"database"|"cache"|"queue"|"object_storage"|"other", '
                '"connection_security": str, "notes": str}], '
                '"summary": str}'
            ),
        },
    ]


PHASE1_BUILDERS = {
    "file_tree": _build_file_tree_prompt,
    "dependencies": _build_dependencies_prompt,
    "frameworks": _build_frameworks_prompt,
    "data_stores": _build_data_stores_prompt,
}
