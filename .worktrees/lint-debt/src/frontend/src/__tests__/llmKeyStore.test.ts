import { describe, it, expect, beforeEach } from 'vitest';
import { useLLMKeyStore } from '@/store/llmKeyStore';

describe('llmKeyStore', () => {
  beforeEach(() => {
    useLLMKeyStore.getState().clearAllKeys();
  });

  it('starts with empty keys', () => {
    const state = useLLMKeyStore.getState();
    expect(state.anthropicKey).toBe('');
    expect(state.openaiKey).toBe('');
    expect(state.hasAnyKey()).toBe(false);
  });

  it('sets a key for a provider', () => {
    useLLMKeyStore.getState().setKey('anthropic', 'sk-test-123');
    expect(useLLMKeyStore.getState().anthropicKey).toBe('sk-test-123');
    expect(useLLMKeyStore.getState().hasAnyKey()).toBe(true);
  });

  it('clears all keys', () => {
    useLLMKeyStore.getState().setKey('anthropic', 'sk-test');
    useLLMKeyStore.getState().setKey('groq', 'gsk-test');
    useLLMKeyStore.getState().clearAllKeys();
    expect(useLLMKeyStore.getState().hasAnyKey()).toBe(false);
  });

  it('generates correct headers', () => {
    useLLMKeyStore.getState().setKey('groq', 'gsk-test');
    useLLMKeyStore.getState().setKey('ollama', 'http://localhost:11434');
    const headers = useLLMKeyStore.getState().getHeaders();
    expect(headers['X-Groq-Api-Key']).toBe('gsk-test');
    expect(headers['X-Ollama-Base-Url']).toBe('http://localhost:11434');
    expect(headers['X-Anthropic-Api-Key']).toBeUndefined();
  });

  it('never persists to localStorage', () => {
    useLLMKeyStore.getState().setKey('openai', 'sk-test');
    // Zustand with no persist middleware = memory only
    // Verify by checking that globalThis.localStorage has no store-related keys
    const storage = globalThis.localStorage;
    if (storage && typeof storage.getItem === 'function') {
      expect(storage.getItem('llm-keys')).toBeNull();
      expect(storage.getItem('llmKeyStore')).toBeNull();
    }
    // Also verify keys reset properly (memory-only behavior)
    useLLMKeyStore.getState().clearAllKeys();
    expect(useLLMKeyStore.getState().openaiKey).toBe('');
  });
});
