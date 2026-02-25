"""Tests for analysis.llm.dispatcher and work_units — no LLM calls."""
import asyncio
import logging

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from analysis.llm.dispatcher import (
    _run_analysis_pipeline,
    get_job_result,
    get_job_status,
    start_analysis,
)
from analysis.llm.schemas import (
    AnalysisJobStatus,
    AnalysisTier,
    LLMProviderKeys,
    ThreatFinding,
    WorkUnitResult,
)
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


class TestRunAnalysisPipeline:
    """Gap A: Tests for _run_analysis_pipeline Neo4j persistence logic."""

    def _make_job(self, job_id: str, model_id: str) -> AnalysisJobStatus:
        return AnalysisJobStatus(
            job_id=job_id,
            model_id=model_id,
            tier=AnalysisTier.TIER_0,
            status="pending",
        )

    @patch("analysis.llm.dispatcher.get_units_for_tier")
    @patch("analysis.llm.dispatcher.get_ready_units")
    @patch("analysis.llm.dispatcher._execute_work_unit", new_callable=AsyncMock)
    def test_imports_threats_when_findings_exist(
        self, mock_execute, mock_ready, mock_get_units
    ):
        """When stride_analysis produces findings, import_threats_to_neo4j is called."""
        import analysis.llm.dispatcher as dispatcher

        job_id = "job-test-import"
        model_id = "model-test"

        mock_unit = MagicMock()
        mock_unit.name = "stride_analysis"
        mock_unit.phase = 3
        mock_get_units.return_value = [mock_unit]
        mock_ready.side_effect = [[mock_unit], []]

        finding_data = {
            "findings": [
                {
                    "title": "SQLi",
                    "stride_category": "tampering",
                    "severity": "critical",
                    "likelihood": "likely",
                    "description": "SQL injection",
                    "attack_vector": "network",
                    "remediation": "Use parameterized queries",
                    "confidence": 0.9,
                }
            ]
        }
        mock_execute.return_value = WorkUnitResult(
            unit_name="stride_analysis",
            phase=3,
            data=finding_data,
            tokens_used=0,
            duration_seconds=0.1,
        )

        dispatcher._jobs[job_id] = self._make_job(job_id, model_id)

        mock_import = MagicMock(return_value=(1, 1))
        mock_threats_from = MagicMock(return_value=[{"threat_id": "t-1"}])
        mock_threat_importer = MagicMock(
            import_threats_to_neo4j=mock_import,
            threats_from_findings=mock_threats_from,
        )

        with patch.dict(
            "sys.modules",
            {"importers.threat_importer": mock_threat_importer},
        ), patch("src.db.get_driver", return_value=MagicMock()):
            asyncio.run(
                _run_analysis_pipeline(
                    job_id,
                    model_id,
                    AnalysisTier.TIER_0,
                    LLMProviderKeys(),
                    {},
                )
            )

        assert dispatcher._jobs[job_id].status == "completed"
        mock_import.assert_called_once()
        # Clean up
        dispatcher._jobs.pop(job_id, None)
        dispatcher._results.pop(job_id, None)

    @patch("analysis.llm.dispatcher.get_units_for_tier")
    @patch("analysis.llm.dispatcher.get_ready_units")
    @patch("analysis.llm.dispatcher._execute_work_unit", new_callable=AsyncMock)
    def test_neo4j_import_failure_does_not_crash(
        self, mock_execute, mock_ready, mock_get_units, caplog
    ):
        """If Neo4j import fails, pipeline still completes with a warning."""
        import analysis.llm.dispatcher as dispatcher

        job_id = "job-test-fail"
        model_id = "model-fail"

        mock_unit = MagicMock()
        mock_unit.name = "stride_analysis"
        mock_unit.phase = 3
        mock_get_units.return_value = [mock_unit]
        mock_ready.side_effect = [[mock_unit], []]

        mock_execute.return_value = WorkUnitResult(
            unit_name="stride_analysis",
            phase=3,
            data={
                "findings": [
                    {
                        "title": "XSS",
                        "stride_category": "tampering",
                        "severity": "high",
                        "likelihood": "possible",
                        "description": "Cross-site scripting",
                        "attack_vector": "network",
                        "remediation": "Escape output",
                        "confidence": 0.8,
                    }
                ]
            },
            tokens_used=0,
            duration_seconds=0.1,
        )

        dispatcher._jobs[job_id] = self._make_job(job_id, model_id)

        mock_threat_importer = MagicMock(
            import_threats_to_neo4j=MagicMock(
                side_effect=RuntimeError("Neo4j down")
            ),
            threats_from_findings=MagicMock(
                return_value=[{"threat_id": "t-x"}]
            ),
        )

        with patch.dict(
            "sys.modules",
            {"importers.threat_importer": mock_threat_importer},
        ), patch("src.db.get_driver", return_value=MagicMock()):
            with caplog.at_level(logging.WARNING, logger="threat_oracle.llm"):
                asyncio.run(
                    _run_analysis_pipeline(
                        job_id,
                        model_id,
                        AnalysisTier.TIER_0,
                        LLMProviderKeys(),
                        {},
                    )
                )

        assert dispatcher._jobs[job_id].status == "completed"
        assert any("Failed to persist" in r.message for r in caplog.records)
        # Clean up
        dispatcher._jobs.pop(job_id, None)
        dispatcher._results.pop(job_id, None)

    @patch("analysis.llm.dispatcher.get_units_for_tier")
    @patch("analysis.llm.dispatcher.get_ready_units")
    @patch("analysis.llm.dispatcher._execute_work_unit", new_callable=AsyncMock)
    def test_no_import_when_no_findings(
        self, mock_execute, mock_ready, mock_get_units
    ):
        """When no findings are produced, import_threats_to_neo4j is NOT called."""
        import analysis.llm.dispatcher as dispatcher

        job_id = "job-test-empty"
        model_id = "model-empty"

        mock_unit = MagicMock()
        mock_unit.name = "file_tree"
        mock_unit.phase = 1
        mock_get_units.return_value = [mock_unit]
        mock_ready.side_effect = [[mock_unit], []]

        mock_execute.return_value = WorkUnitResult(
            unit_name="file_tree",
            phase=1,
            data={"categories": {}},
            tokens_used=0,
            duration_seconds=0.1,
        )

        dispatcher._jobs[job_id] = self._make_job(job_id, model_id)

        mock_import = MagicMock()
        mock_threat_importer = MagicMock(
            import_threats_to_neo4j=mock_import,
            threats_from_findings=MagicMock(),
        )

        with patch.dict(
            "sys.modules",
            {"importers.threat_importer": mock_threat_importer},
        ):
            asyncio.run(
                _run_analysis_pipeline(
                    job_id,
                    model_id,
                    AnalysisTier.TIER_0,
                    LLMProviderKeys(),
                    {},
                )
            )

        assert dispatcher._jobs[job_id].status == "completed"
        assert dispatcher._jobs[job_id].threats_found == 0
        # import was never called because findings list is empty
        mock_import.assert_not_called()
        # Clean up
        dispatcher._jobs.pop(job_id, None)
        dispatcher._results.pop(job_id, None)
