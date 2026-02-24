"""Analysis dispatcher — orchestrates work units with fan-out/fan-in."""
from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from analysis.llm.schemas import (
    AnalysisJobStatus,
    AnalysisResult,
    AnalysisTier,
    LLMProviderKeys,
    ThreatFinding,
    WorkUnitResult,
)
from analysis.llm.work_units import get_ready_units, get_units_for_tier

logger = logging.getLogger("threat_oracle.llm")

# In-memory job store
_jobs: dict[str, AnalysisJobStatus] = {}
_results: dict[str, AnalysisResult] = {}

# Concurrency limit for LLM calls
_LLM_SEMAPHORE = asyncio.Semaphore(5)


async def _execute_work_unit(
    unit_name: str,
    phase: int,
    tier: AnalysisTier,
    keys: LLMProviderKeys,
    model_data: dict[str, Any],
    prior_results: dict[str, WorkUnitResult],
) -> WorkUnitResult:
    """Execute a single work unit, calling LLM if needed."""
    start = time.monotonic()

    if tier == AnalysisTier.TIER_0:
        # Heuristic-only: return data from repo_analyzer
        return WorkUnitResult(
            unit_name=unit_name,
            phase=phase,
            data=model_data.get(unit_name, {}),
            tokens_used=0,
            duration_seconds=time.monotonic() - start,
        )

    # Build prompt from phase-specific prompt builder
    from analysis.llm.prompts import get_prompt_builder

    prompt_builder = get_prompt_builder(unit_name)
    messages = prompt_builder(model_data, prior_results)

    # Call LLM with concurrency limit
    async with _LLM_SEMAPHORE:
        from analysis.llm.provider import call_llm

        result = await call_llm(messages, tier, keys)

    # Parse response
    try:
        data = json.loads(result.content)
    except json.JSONDecodeError:
        data = {"raw_response": result.content}

    return WorkUnitResult(
        unit_name=unit_name,
        phase=phase,
        data=data,
        tokens_used=result.tokens_used,
        duration_seconds=time.monotonic() - start,
    )


async def _run_analysis_pipeline(
    job_id: str,
    model_id: str,
    tier: AnalysisTier,
    keys: LLMProviderKeys,
    model_data: dict[str, Any],
) -> None:
    """Run the full analysis pipeline for a job."""
    job = _jobs[job_id]
    job.status = "running"
    job.started_at = datetime.now(timezone.utc).isoformat()

    units = get_units_for_tier(tier.value)
    job.units_total = len(units)

    completed: set[str] = set()
    work_results: dict[str, WorkUnitResult] = {}
    findings: list[ThreatFinding] = []
    total_tokens = 0

    try:
        while len(completed) < len(units):
            ready = get_ready_units(completed, tier.value)
            if not ready:
                if len(completed) < len(units):
                    logger.error(
                        "Deadlock: no ready units but %d/%d completed",
                        len(completed),
                        len(units),
                    )
                    raise RuntimeError("Analysis pipeline deadlocked")
                break

            # Fan out: execute all ready units concurrently
            async with asyncio.TaskGroup() as tg:
                tasks = {}
                for unit in ready:
                    task = tg.create_task(
                        _execute_work_unit(
                            unit.name,
                            unit.phase,
                            tier,
                            keys,
                            model_data,
                            work_results,
                        )
                    )
                    tasks[unit.name] = task

            # Collect results
            for name, task in tasks.items():
                result = task.result()
                work_results[name] = result
                completed.add(name)
                total_tokens += result.tokens_used

                # Extract findings from STRIDE analysis
                if name == "stride_analysis" and isinstance(result.data, dict):
                    for finding_data in result.data.get("findings", []):
                        try:
                            findings.append(ThreatFinding(**finding_data))
                        except Exception as e:
                            logger.warning("Failed to parse finding: %s", e)

                # Update enrichment data from mapping units
                if name in ("cwe_mapping", "attack_mapping") and isinstance(
                    result.data, dict
                ):
                    mappings = result.data.get("mappings", {})
                    for i, finding in enumerate(findings):
                        if str(i) in mappings or finding.title in mappings:
                            mapping = mappings.get(
                                str(i), mappings.get(finding.title, {})
                            )
                            if name == "cwe_mapping" and "cwe_ids" in mapping:
                                finding.cwe_ids = mapping["cwe_ids"]
                            elif (
                                name == "attack_mapping"
                                and "technique_ids" in mapping
                            ):
                                finding.attack_technique_ids = mapping[
                                    "technique_ids"
                                ]

            # Update progress
            job.units_completed = len(completed)
            job.current_phase = (
                max(work_results[n].phase for n in completed) if completed else 1
            )
            job.progress_pct = int((len(completed) / len(units)) * 100)
            job.threats_found = len(findings)

        # Store results
        end_time = datetime.now(timezone.utc).isoformat()
        _results[job_id] = AnalysisResult(
            job_id=job_id,
            model_id=model_id,
            tier=tier,
            findings=findings,
            work_units=list(work_results.values()),
            total_tokens=total_tokens,
            total_duration_seconds=sum(
                r.duration_seconds for r in work_results.values()
            ),
        )

        job.status = "completed"
        job.progress_pct = 100
        job.completed_at = end_time

    except Exception as e:
        logger.exception("Analysis failed for job %s", job_id)
        job.status = "failed"
        job.error = str(e)
        job.completed_at = datetime.now(timezone.utc).isoformat()


def start_analysis(
    model_id: str,
    tier: AnalysisTier,
    keys: LLMProviderKeys,
    model_data: dict[str, Any],
) -> str:
    """Start an analysis job in the background. Returns job_id."""
    job_id = f"job-{uuid4().hex[:12]}"

    _jobs[job_id] = AnalysisJobStatus(
        job_id=job_id,
        model_id=model_id,
        tier=tier,
        status="pending",
        progress_pct=0,
    )

    # Launch background task
    asyncio.get_event_loop().create_task(
        _run_analysis_pipeline(job_id, model_id, tier, keys, model_data)
    )

    return job_id


def get_job_status(job_id: str) -> AnalysisJobStatus | None:
    """Get the current status of an analysis job."""
    return _jobs.get(job_id)


def get_job_result(job_id: str) -> AnalysisResult | None:
    """Get the completed result of an analysis job."""
    return _results.get(job_id)
