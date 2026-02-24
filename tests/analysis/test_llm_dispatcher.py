"""Tests for analysis.llm.dispatcher and work_units — no LLM calls."""
import pytest

from analysis.llm.dispatcher import get_job_result, get_job_status, start_analysis
from analysis.llm.schemas import AnalysisTier, LLMProviderKeys
from analysis.llm.work_units import (
    ALL_WORK_UNITS,
    get_ready_units,
    get_units_for_tier,
)


class TestWorkUnits:
    def test_tier0_excludes_llm_units(self):
        units = get_units_for_tier("tier_0")
        names = {u.name for u in units}
        # Phase 1 & 2 are tier_0, phase 3 requires tier_1
        assert "file_tree" in names
        assert "dependencies" in names
        assert "data_flows" in names
        assert "stride_analysis" not in names
        assert "cwe_mapping" not in names

    def test_tier1_includes_all_units(self):
        units = get_units_for_tier("tier_1")
        names = {u.name for u in units}
        assert "stride_analysis" in names
        assert "cwe_mapping" in names
        assert "remediation" in names
        assert len(units) == len(ALL_WORK_UNITS)

    def test_tier2_includes_all_units(self):
        units = get_units_for_tier("tier_2")
        assert len(units) == len(ALL_WORK_UNITS)

    def test_dependency_graph_is_acyclic(self):
        """Verify no circular dependencies exist in work units."""
        unit_map = {u.name: u for u in ALL_WORK_UNITS}
        visited: set[str] = set()
        in_stack: set[str] = set()

        def has_cycle(name: str) -> bool:
            if name in in_stack:
                return True
            if name in visited:
                return False
            visited.add(name)
            in_stack.add(name)
            for dep in unit_map[name].depends_on:
                if has_cycle(dep):
                    return True
            in_stack.discard(name)
            return False

        for unit in ALL_WORK_UNITS:
            assert not has_cycle(unit.name), f"Cycle detected involving {unit.name}"

    def test_ready_units_phase1_all_ready(self):
        """All phase 1 units should be ready with no completions."""
        ready = get_ready_units(set(), "tier_1")
        names = {u.name for u in ready}
        assert "file_tree" in names
        assert "dependencies" in names
        assert "frameworks" in names
        assert "data_stores" in names

    def test_ready_units_phase2_blocked(self):
        """Phase 2 units need phase 1 deps completed."""
        ready = get_ready_units(set(), "tier_1")
        names = {u.name for u in ready}
        assert "api_endpoints" not in names

    def test_ready_units_phase2_unblocked(self):
        # With phase 1 done, api_endpoints becomes ready (depends on file_tree + frameworks)
        completed = {"file_tree", "dependencies", "frameworks", "data_stores"}
        ready = get_ready_units(completed, "tier_1")
        names = {u.name for u in ready}
        assert "api_endpoints" in names
        # trust_boundaries needs api_endpoints + data_stores, so still blocked
        assert "trust_boundaries" not in names

    def test_trust_boundaries_unblocked(self):
        completed = {"file_tree", "dependencies", "frameworks", "data_stores", "api_endpoints"}
        ready = get_ready_units(completed, "tier_1")
        names = {u.name for u in ready}
        assert "trust_boundaries" in names
        assert "auth_flows" in names

    def test_all_units_eventually_complete(self):
        """Simulate full pipeline: all units should become ready eventually."""
        completed: set[str] = set()
        total = len(get_units_for_tier("tier_1"))
        iterations = 0
        max_iterations = 20

        while len(completed) < total and iterations < max_iterations:
            ready = get_ready_units(completed, "tier_1")
            assert ready, f"Deadlock at iteration {iterations}, completed: {completed}"
            for unit in ready:
                completed.add(unit.name)
            iterations += 1

        assert len(completed) == total


class TestDispatcher:
    def test_get_job_status_unknown(self):
        assert get_job_status("nonexistent-job") is None

    def test_get_job_result_unknown(self):
        assert get_job_result("nonexistent-job") is None

    def test_start_analysis_returns_job_id(self):
        """start_analysis returns a job_id string (needs event loop)."""
        import asyncio

        async def _test():
            keys = LLMProviderKeys()
            job_id = start_analysis(
                model_id="test-model",
                tier=AnalysisTier.TIER_0,
                keys=keys,
                model_data={},
            )
            assert isinstance(job_id, str)
            assert job_id.startswith("job-")

            status = get_job_status(job_id)
            assert status is not None
            assert status.status in ("pending", "running")

        asyncio.run(_test())
