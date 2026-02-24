"""Tests for analysis.llm.provider — routing logic only, no LLM calls."""
import pytest

from analysis.llm.provider import _select_provider
from analysis.llm.schemas import AnalysisTier, LLMProviderKeys


class TestSelectProvider:
    def test_tier1_picks_groq_first(self):
        keys = LLMProviderKeys(
            groq_api_key="gsk-test",
            google_api_key="goog-test",
        )
        model, kwargs = _select_provider(AnalysisTier.TIER_1, keys)
        assert model == "groq/llama-3.3-70b-versatile"
        assert kwargs == {"api_key": "gsk-test"}

    def test_tier1_falls_back_to_google(self):
        keys = LLMProviderKeys(google_api_key="goog-test")
        model, kwargs = _select_provider(AnalysisTier.TIER_1, keys)
        assert model == "gemini/gemini-2.0-flash"
        assert kwargs == {"api_key": "goog-test"}

    def test_tier2_picks_anthropic_first(self):
        keys = LLMProviderKeys(
            anthropic_api_key="sk-ant-test",
            openai_api_key="sk-oai-test",
        )
        model, kwargs = _select_provider(AnalysisTier.TIER_2, keys)
        assert model == "anthropic/claude-sonnet-4-20250514"
        assert kwargs == {"api_key": "sk-ant-test"}

    def test_tier2_falls_back_to_openai(self):
        keys = LLMProviderKeys(openai_api_key="sk-oai-test")
        model, kwargs = _select_provider(AnalysisTier.TIER_2, keys)
        assert model == "gpt-4o"
        assert kwargs == {"api_key": "sk-oai-test"}

    def test_no_keys_raises_value_error(self):
        keys = LLMProviderKeys()
        with pytest.raises(ValueError, match="No API key provided"):
            _select_provider(AnalysisTier.TIER_1, keys)

    def test_no_keys_for_tier2_raises(self):
        # Having a groq key doesn't help with tier_2
        keys = LLMProviderKeys(groq_api_key="gsk-test")
        with pytest.raises(ValueError, match="No API key provided"):
            _select_provider(AnalysisTier.TIER_2, keys)

    def test_ollama_gets_api_base(self):
        keys = LLMProviderKeys(ollama_base_url="http://localhost:11434")
        model, kwargs = _select_provider(AnalysisTier.TIER_1, keys)
        assert model == "ollama/llama3.1"
        assert kwargs == {"api_base": "http://localhost:11434"}
        assert "api_key" not in kwargs
