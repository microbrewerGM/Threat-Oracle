"""LLM provider abstraction using LiteLLM with BYOK routing."""
from __future__ import annotations

import logging
import time
from typing import Any

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from analysis.llm.schemas import AnalysisTier, LLMProviderKeys

logger = logging.getLogger("threat_oracle.llm")

# Routing table: ordered list of (litellm_model, key_field) per tier
TIER_ROUTING: dict[AnalysisTier, list[tuple[str, str]]] = {
    AnalysisTier.TIER_1: [
        ("groq/llama-3.3-70b-versatile", "groq_api_key"),
        ("gemini/gemini-2.0-flash", "google_api_key"),
        ("ollama/llama3.1", "ollama_base_url"),
    ],
    AnalysisTier.TIER_2: [
        ("anthropic/claude-sonnet-4-20250514", "anthropic_api_key"),
        ("gpt-4o", "openai_api_key"),
        ("gemini/gemini-2.5-pro", "google_api_key"),
    ],
}


def _select_provider(
    tier: AnalysisTier, keys: LLMProviderKeys
) -> tuple[str, dict[str, str]]:
    """Select first available provider for the tier based on provided keys.

    Returns (model_name, extra_kwargs_for_litellm).
    Raises ValueError if no provider has a key.
    """
    routes = TIER_ROUTING.get(tier, [])
    for model, key_field in routes:
        key_value = getattr(keys, key_field, None)
        if key_value:
            kwargs: dict[str, str] = {}
            if key_field == "ollama_base_url":
                kwargs["api_base"] = key_value
            else:
                kwargs["api_key"] = key_value
            return model, kwargs
    raise ValueError(
        f"No API key provided for any {tier.value} provider. "
        f"Available providers: {[r[1] for r in routes]}"
    )


class LLMCallResult:
    """Result from an LLM call."""

    def __init__(
        self, content: str, tokens_used: int, duration_seconds: float, model: str
    ):
        self.content = content
        self.tokens_used = tokens_used
        self.duration_seconds = duration_seconds
        self.model = model


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    retry=retry_if_exception_type((ConnectionError, TimeoutError)),
    reraise=True,
)
async def call_llm(
    messages: list[dict[str, str]],
    tier: AnalysisTier,
    keys: LLMProviderKeys,
    temperature: float = 0.2,
    max_tokens: int = 4096,
) -> LLMCallResult:
    """Call an LLM provider with automatic routing and retry.

    Uses deferred import of litellm to avoid import-time side effects.
    """
    import litellm  # deferred import

    model, extra_kwargs = _select_provider(tier, keys)
    logger.info("LLM call: model=%s, messages=%d", model, len(messages))

    start = time.monotonic()
    response = await litellm.acompletion(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        **extra_kwargs,
    )
    duration = time.monotonic() - start

    content = response.choices[0].message.content or ""
    tokens = getattr(response.usage, "total_tokens", 0) if response.usage else 0

    logger.info(
        "LLM response: model=%s, tokens=%d, duration=%.1fs", model, tokens, duration
    )
    return LLMCallResult(
        content=content, tokens_used=tokens, duration_seconds=duration, model=model
    )
