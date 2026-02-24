"""Prompt builders for each analysis phase."""
from __future__ import annotations

from typing import Any, Callable

from analysis.llm.prompts.phase1_extraction import PHASE1_BUILDERS
from analysis.llm.prompts.phase2_architecture import PHASE2_BUILDERS
from analysis.llm.prompts.phase3_threats import PHASE3_BUILDERS

_ALL_BUILDERS: dict[str, Callable] = {
    **PHASE1_BUILDERS,
    **PHASE2_BUILDERS,
    **PHASE3_BUILDERS,
}


def get_prompt_builder(
    unit_name: str,
) -> Callable[[dict[str, Any], dict], list[dict[str, str]]]:
    """Get the prompt builder function for a work unit."""
    builder = _ALL_BUILDERS.get(unit_name)
    if not builder:
        raise ValueError(f"No prompt builder for work unit: {unit_name}")
    return builder
