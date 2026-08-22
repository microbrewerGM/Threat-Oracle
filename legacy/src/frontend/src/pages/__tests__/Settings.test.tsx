import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Settings from '../Settings';

// Mock the LLM key store
const mockSetKey = vi.fn();
const mockClearAllKeys = vi.fn();
const mockHasAnyKey = vi.fn();

vi.mock('@/store/llmKeyStore', () => ({
  useLLMKeyStore: vi.fn(() => ({
    anthropicKey: '',
    openaiKey: '',
    googleKey: '',
    groqKey: '',
    ollamaUrl: '',
    setKey: mockSetKey,
    clearAllKeys: mockClearAllKeys,
    hasAnyKey: mockHasAnyKey,
  })),
}));

import { useLLMKeyStore } from '@/store/llmKeyStore';

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasAnyKey.mockReturnValue(false);
  });

  it('renders LLM API key inputs for all providers', () => {
    render(<Settings />);

    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Groq')).toBeInTheDocument();
    expect(screen.getByText('Ollama (Local)')).toBeInTheDocument();
  });

  it('setting a key calls setKey on the store', () => {
    render(<Settings />);

    const anthropicInput = screen.getByPlaceholderText('sk-ant-...');
    fireEvent.change(anthropicInput, { target: { value: 'my-key' } });

    expect(mockSetKey).toHaveBeenCalledWith('anthropic', 'my-key');
  });

  it('setting OpenAI key calls setKey with openai provider', () => {
    render(<Settings />);

    const openaiInput = screen.getByPlaceholderText('sk-...');
    fireEvent.change(openaiInput, { target: { value: 'openai-key' } });

    expect(mockSetKey).toHaveBeenCalledWith('openai', 'openai-key');
  });

  it('setting Google key calls setKey with google provider', () => {
    render(<Settings />);

    const googleInput = screen.getByPlaceholderText('AIza...');
    fireEvent.change(googleInput, { target: { value: 'google-key' } });

    expect(mockSetKey).toHaveBeenCalledWith('google', 'google-key');
  });

  it('Clear All button calls clearAllKeys', () => {
    mockHasAnyKey.mockReturnValue(true);

    // Re-mock to return keys present
    (useLLMKeyStore as any).mockReturnValue({
      anthropicKey: 'some-key',
      openaiKey: '',
      googleKey: '',
      groqKey: '',
      ollamaUrl: '',
      setKey: mockSetKey,
      clearAllKeys: mockClearAllKeys,
      hasAnyKey: mockHasAnyKey,
    });

    render(<Settings />);

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockClearAllKeys).toHaveBeenCalled();
  });

  it('Clear All button is hidden when no keys are set', () => {
    mockHasAnyKey.mockReturnValue(false);

    render(<Settings />);

    expect(screen.queryByText('Clear All')).not.toBeInTheDocument();
  });

  it('password inputs mask the values', () => {
    render(<Settings />);

    const anthropicInput = screen.getByPlaceholderText('sk-ant-...');
    expect(anthropicInput).toHaveAttribute('type', 'password');

    const openaiInput = screen.getByPlaceholderText('sk-...');
    expect(openaiInput).toHaveAttribute('type', 'password');

    const googleInput = screen.getByPlaceholderText('AIza...');
    expect(googleInput).toHaveAttribute('type', 'password');

    const groqInput = screen.getByPlaceholderText('gsk_...');
    expect(groqInput).toHaveAttribute('type', 'password');
  });

  it('Ollama URL input is type text, not password', () => {
    render(<Settings />);

    const ollamaInput = screen.getByPlaceholderText('http://localhost:11434');
    expect(ollamaInput).toHaveAttribute('type', 'text');
  });

  it('renders appearance and editor settings', () => {
    render(<Settings />);

    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Auto Save')).toBeInTheDocument();
    expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<Settings />);

    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Version: 0.1.0')).toBeInTheDocument();
  });
});
