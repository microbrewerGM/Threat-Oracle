import { create } from 'zustand';

interface LLMKeyState {
  anthropicKey: string;
  openaiKey: string;
  googleKey: string;
  groqKey: string;
  ollamaUrl: string;
  setKey: (provider: LLMProvider, value: string) => void;
  clearAllKeys: () => void;
  hasAnyKey: () => boolean;
  getHeaders: () => Record<string, string>;
}

type LLMProvider = 'anthropic' | 'openai' | 'google' | 'groq' | 'ollama';

const INITIAL_STATE = {
  anthropicKey: '',
  openaiKey: '',
  googleKey: '',
  groqKey: '',
  ollamaUrl: '',
};

export const useLLMKeyStore = create<LLMKeyState>((set, get) => ({
  ...INITIAL_STATE,

  setKey: (provider, value) => {
    const keyMap: Record<LLMProvider, string> = {
      anthropic: 'anthropicKey',
      openai: 'openaiKey',
      google: 'googleKey',
      groq: 'groqKey',
      ollama: 'ollamaUrl',
    };
    set({ [keyMap[provider]]: value });
  },

  clearAllKeys: () => set(INITIAL_STATE),

  hasAnyKey: () => {
    const state = get();
    return Boolean(state.anthropicKey || state.openaiKey || state.googleKey || state.groqKey || state.ollamaUrl);
  },

  getHeaders: () => {
    const state = get();
    const headers: Record<string, string> = {};
    if (state.anthropicKey) headers['X-Anthropic-Api-Key'] = state.anthropicKey;
    if (state.openaiKey) headers['X-OpenAI-Api-Key'] = state.openaiKey;
    if (state.googleKey) headers['X-Google-Api-Key'] = state.googleKey;
    if (state.groqKey) headers['X-Groq-Api-Key'] = state.groqKey;
    if (state.ollamaUrl) headers['X-Ollama-Base-Url'] = state.ollamaUrl;
    return headers;
  },
}));

export type { LLMProvider, LLMKeyState };
