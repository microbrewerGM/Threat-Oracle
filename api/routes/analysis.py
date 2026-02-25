"""Analysis endpoints — trigger LLM analysis and query results."""
import logging

from fastapi import APIRouter, Depends, Header, HTTPException
from neo4j import Session

from api.dependencies import get_neo4j_session, require_api_key
from api.models import (
    AnalysisJobResponse,
    AnalysisStatusResponse,
    AnalyzeModelRequest,
    ThreatResponse,
    ThreatsListResponse,
)
from analysis.llm.dispatcher import get_job_status, start_analysis
from analysis.llm.schemas import AnalysisTier, LLMProviderKeys

logger = logging.getLogger("threat_oracle.analysis")

router = APIRouter(prefix="/api/v1/models", tags=["analysis"])


def _extract_llm_keys(
    x_anthropic_api_key: str | None = Header(None),
    x_openai_api_key: str | None = Header(None),
    x_google_api_key: str | None = Header(None),
    x_groq_api_key: str | None = Header(None),
    x_ollama_base_url: str | None = Header(None),
) -> LLMProviderKeys:
    """Extract BYOK keys from request headers. Never logged, never stored."""
    return LLMProviderKeys(
        anthropic_api_key=x_anthropic_api_key,
        openai_api_key=x_openai_api_key,
        google_api_key=x_google_api_key,
        groq_api_key=x_groq_api_key,
        ollama_base_url=x_ollama_base_url,
    )


def _get_model_data(model_id: str, session: Session) -> dict:
    """Fetch model data from Neo4j for analysis input."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})
        OPTIONAL MATCH (m)-[:HAS_ASSET]->(ta:TechnicalAsset)
        OPTIONAL MATCH (m)-[:HAS_BOUNDARY]->(tb:TrustBoundary)
        OPTIONAL MATCH (m)-[:HAS_FLOW]->(df:DataFlow)
        OPTIONAL MATCH (m)-[:HAS_DATA_ASSET]->(da:DataAsset)
        RETURN m,
               collect(DISTINCT properties(ta)) AS technical_assets,
               collect(DISTINCT properties(tb)) AS trust_boundaries,
               collect(DISTINCT properties(df)) AS data_flows,
               collect(DISTINCT properties(da)) AS data_assets
        """,
        model_id=model_id,
    )
    record = result.single()
    if not record or record["m"] is None:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")

    model_node = dict(record["m"])
    return {
        "model": model_node,
        "technical_assets": [i for i in record["technical_assets"] if i],
        "trust_boundaries": [i for i in record["trust_boundaries"] if i],
        "data_flows": [i for i in record["data_flows"] if i],
        "data_assets": [i for i in record["data_assets"] if i],
        "repo_url": model_node.get("repo_url", ""),
    }


@router.post("/{model_id}/analyze", response_model=AnalysisJobResponse)
def trigger_analysis(
    model_id: str,
    body: AnalyzeModelRequest,
    session: Session = Depends(get_neo4j_session),
    keys: LLMProviderKeys = Depends(_extract_llm_keys),
    _auth: str = Depends(require_api_key),
):
    """Trigger LLM-powered threat analysis on a model.

    Pass BYOK keys via headers:
    - X-Anthropic-Api-Key
    - X-OpenAI-Api-Key
    - X-Google-Api-Key
    - X-Groq-Api-Key
    - X-Ollama-Base-Url
    """
    tier = AnalysisTier(body.tier)

    # Tier 1+ requires at least one LLM key
    if tier != AnalysisTier.TIER_0 and not keys.has_any_key():
        raise HTTPException(
            status_code=400,
            detail="At least one LLM API key is required for tier_1 or tier_2 analysis. "
            "Pass keys via X-Anthropic-Api-Key, X-OpenAI-Api-Key, X-Google-Api-Key, "
            "X-Groq-Api-Key headers, or X-Ollama-Base-Url.",
        )

    # Fetch model data from Neo4j
    model_data = _get_model_data(model_id, session)

    # If model has a repo_url, scan the repo and merge raw data for LLM prompts
    repo_url = model_data.get("repo_url", "")
    if repo_url:
        try:
            from analysis.repo_analyzer import analyze_repo

            repo_data = analyze_repo(repo_url)
            # Merge raw GitHub data into model_data for prompt builders
            # repo_data keys: technical_assets, data_assets, trust_boundaries, data_flows, metadata
            metadata = repo_data.get("metadata", {})
            model_data["file_tree"] = []  # Will be populated below
            model_data["dependencies"] = {}
            model_data["languages"] = metadata.get("languages", {})

            # Re-fetch tree paths for prompt builders (analyze_repo already fetched them
            # but doesn't expose raw paths — re-derive from technical_assets heuristics)
            # Instead, call GitHub API directly for raw tree
            try:
                from analysis.repo_analyzer import parse_github_url, _validate_github_names
                import httpx

                owner, repo_name = parse_github_url(repo_url)
                _validate_github_names(owner, repo_name)
                base = f"https://api.github.com/repos/{owner}/{repo_name}"
                with httpx.Client(
                    timeout=30,
                    follow_redirects=False,
                    headers={"Accept": "application/vnd.github.v3+json"},
                ) as client:
                    # File tree
                    default_branch = metadata.get("default_branch", "main")
                    resp = client.get(
                        f"{base}/git/trees/{default_branch}",
                        params={"recursive": "1"},
                    )
                    resp.raise_for_status()
                    tree_data = resp.json()
                    model_data["file_tree"] = [
                        item["path"]
                        for item in tree_data.get("tree", [])
                        if item.get("type") in ("blob", "tree")
                    ]
            except Exception as tree_err:
                logger.warning("Failed to fetch raw tree for %s: %s", repo_url, tree_err)

            # Merge inferred assets so Tier 0 has useful data
            if not model_data.get("technical_assets"):
                model_data["technical_assets"] = repo_data.get("technical_assets", [])
            if not model_data.get("data_assets"):
                model_data["data_assets"] = repo_data.get("data_assets", [])
            if not model_data.get("trust_boundaries"):
                model_data["trust_boundaries"] = repo_data.get("trust_boundaries", [])
            if not model_data.get("data_flows"):
                model_data["data_flows"] = repo_data.get("data_flows", [])

        except Exception as e:
            logger.warning("Failed to analyze repo %s: %s", repo_url, e)

    # Start background analysis
    job_id = start_analysis(model_id, tier, keys, model_data)

    return AnalysisJobResponse(
        job_id=job_id,
        model_id=model_id,
        status="pending",
        message=f"Analysis started with {tier.value}",
    )


@router.get("/{model_id}/analyze/{job_id}", response_model=AnalysisStatusResponse)
def get_analysis_status(
    model_id: str,
    job_id: str,
):
    """Poll analysis job progress."""
    status = get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if status.model_id != model_id:
        raise HTTPException(
            status_code=404, detail=f"Job {job_id} not found for model {model_id}"
        )

    return AnalysisStatusResponse(
        job_id=status.job_id,
        model_id=status.model_id,
        tier=status.tier.value,
        status=status.status,
        progress_pct=status.progress_pct,
        current_phase=status.current_phase,
        units_completed=status.units_completed,
        units_total=status.units_total,
        threats_found=status.threats_found,
        error=status.error,
        started_at=status.started_at,
        completed_at=status.completed_at,
    )


@router.get("/{model_id}/threats", response_model=ThreatsListResponse)
def list_threats(
    model_id: str,
    session: Session = Depends(get_neo4j_session),
):
    """List threats for a model, ordered by risk_score DESC."""
    result = session.run(
        """
        MATCH (m:ThreatModel {model_id: $model_id})-[:HAS_THREAT]->(t:Threat)
        RETURN t ORDER BY t.risk_score DESC
        """,
        model_id=model_id,
    )

    threats = []
    for record in result:
        t = dict(record["t"])
        threats.append(
            ThreatResponse(
                threat_id=t.get("threat_id", ""),
                title=t.get("title", ""),
                stride_category=t.get("stride_category", ""),
                severity=t.get("severity", "medium"),
                likelihood=t.get("likelihood", "possible"),
                risk_score=float(t.get("risk_score", 5.0)),
                attack_vector=t.get("attack_vector", ""),
                description=t.get("description", ""),
                remediation=t.get("remediation", ""),
                confidence=float(t.get("confidence", 0.5)),
                cwe_ids=t.get("cwe_ids", [])
                if isinstance(t.get("cwe_ids"), list)
                else [],
                capec_ids=t.get("capec_ids", [])
                if isinstance(t.get("capec_ids"), list)
                else [],
                attack_technique_ids=t.get("attack_technique_ids", [])
                if isinstance(t.get("attack_technique_ids"), list)
                else [],
                affected_assets=t.get("affected_assets", [])
                if isinstance(t.get("affected_assets"), list)
                else [],
                analysis_tier=t.get("analysis_tier", "tier_1"),
                job_id=t.get("job_id", ""),
            )
        )

    return ThreatsListResponse(
        model_id=model_id,
        threats=threats,
        total=len(threats),
    )
