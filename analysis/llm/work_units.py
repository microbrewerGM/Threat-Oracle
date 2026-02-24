"""Work unit definitions for the three-phase analysis pipeline."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class WorkUnit:
    """A single unit of analysis work."""

    name: str
    phase: int
    description: str
    depends_on: list[str] = field(default_factory=list)
    tier_minimum: str = "tier_0"


# Phase 1: Extraction (parallel, cheap)
FILE_TREE = WorkUnit(
    name="file_tree", phase=1, description="Extract and categorize file tree structure"
)
DEPENDENCIES = WorkUnit(
    name="dependencies",
    phase=1,
    description="Parse dependency manifests (package.json, requirements.txt, etc.)",
)
FRAMEWORKS = WorkUnit(
    name="frameworks",
    phase=1,
    description="Identify frameworks and libraries in use",
)
DATA_STORES = WorkUnit(
    name="data_stores",
    phase=1,
    description="Detect database engines, caches, message queues",
)

# Phase 2: Architecture (sequential dependencies)
API_ENDPOINTS = WorkUnit(
    name="api_endpoints",
    phase=2,
    description="Map API endpoints and their methods",
    depends_on=["file_tree", "frameworks"],
)
AUTH_FLOWS = WorkUnit(
    name="auth_flows",
    phase=2,
    description="Trace authentication and authorization flows",
    depends_on=["api_endpoints"],
)
TRUST_BOUNDARIES = WorkUnit(
    name="trust_boundaries",
    phase=2,
    description="Identify trust boundaries between components",
    depends_on=["api_endpoints", "data_stores"],
)
DATA_FLOWS = WorkUnit(
    name="data_flows",
    phase=2,
    description="Map data flows between components",
    depends_on=["api_endpoints", "trust_boundaries"],
)

# Phase 3: Threat Analysis (fan-out per element)
STRIDE_ANALYSIS = WorkUnit(
    name="stride_analysis",
    phase=3,
    description="STRIDE threat analysis per component",
    depends_on=["data_flows", "auth_flows"],
    tier_minimum="tier_1",
)
CWE_MAPPING = WorkUnit(
    name="cwe_mapping",
    phase=3,
    description="Map findings to CWE weaknesses",
    depends_on=["stride_analysis"],
    tier_minimum="tier_1",
)
ATTACK_MAPPING = WorkUnit(
    name="attack_mapping",
    phase=3,
    description="Map findings to ATT&CK techniques",
    depends_on=["stride_analysis"],
    tier_minimum="tier_1",
)
RISK_SCORING = WorkUnit(
    name="risk_scoring",
    phase=3,
    description="Calculate risk scores based on severity and likelihood",
    depends_on=["cwe_mapping", "attack_mapping"],
    tier_minimum="tier_1",
)
REMEDIATION = WorkUnit(
    name="remediation",
    phase=3,
    description="Generate remediation recommendations",
    depends_on=["risk_scoring"],
    tier_minimum="tier_1",
)

# All work units in execution order
ALL_WORK_UNITS = [
    FILE_TREE,
    DEPENDENCIES,
    FRAMEWORKS,
    DATA_STORES,
    API_ENDPOINTS,
    AUTH_FLOWS,
    TRUST_BOUNDARIES,
    DATA_FLOWS,
    STRIDE_ANALYSIS,
    CWE_MAPPING,
    ATTACK_MAPPING,
    RISK_SCORING,
    REMEDIATION,
]


def get_units_for_tier(tier: str) -> list[WorkUnit]:
    """Return work units available for the given tier."""
    tier_order = {"tier_0": 0, "tier_1": 1, "tier_2": 2}
    tier_level = tier_order.get(tier, 0)
    return [
        u for u in ALL_WORK_UNITS if tier_order.get(u.tier_minimum, 0) <= tier_level
    ]


def get_ready_units(completed: set[str], tier: str) -> list[WorkUnit]:
    """Return units whose dependencies are all completed."""
    available = get_units_for_tier(tier)
    return [
        u
        for u in available
        if u.name not in completed
        and all(dep in completed for dep in u.depends_on)
    ]
