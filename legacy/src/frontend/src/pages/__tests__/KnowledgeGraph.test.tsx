import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import KnowledgeGraph from '../KnowledgeGraph';

// Mock the API module
vi.mock('@/services/api', () => ({
  threatOracleAPI: {
    health: vi.fn(),
    graphStats: vi.fn(),
    searchGraph: vi.fn(),
    listNodes: vi.fn(),
    getNode: vi.fn(),
  },
}));

import { threatOracleAPI } from '@/services/api';

const mockStats = {
  node_counts: { CWE: 969, Technique: 650, CAPEC: 559 },
  total_nodes: 2178,
  relationship_counts: { CHILD_OF: 500 },
  total_relationships: 19000,
};

const mockSearchResults = {
  query: 'SQL',
  results: [
    {
      _labels: ['CWE'],
      name: 'SQL Injection',
      description: 'The product constructs all or part of an SQL command...',
      cwe_id: 'CWE-89',
    },
  ],
  count: 1,
};

const mockNodeDetail = {
  node: {
    _labels: ['CWE'],
    name: 'SQL Injection',
    description: 'SQL injection vulnerability',
    cwe_id: 'CWE-89',
  },
  relationships: {
    outgoing: [
      {
        type: 'CHILD_OF',
        target: { name: 'Injection', cwe_id: 'CWE-74' },
        target_labels: ['CWE'],
      },
    ],
    incoming: [],
  },
};

function renderKnowledgeGraph() {
  return render(
    <MemoryRouter>
      <KnowledgeGraph />
    </MemoryRouter>,
  );
}

describe('KnowledgeGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows API unavailable message when health check fails', async () => {
    vi.mocked(threatOracleAPI.health).mockRejectedValue(new Error('Network error'));

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText('API Not Available')).toBeInTheDocument();
    });
  });

  it('renders stats panel when API is available', async () => {
    vi.mocked(threatOracleAPI.health).mockResolvedValue({ status: 'ok' });
    vi.mocked(threatOracleAPI.graphStats).mockResolvedValue(mockStats);

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText('2,178')).toBeInTheDocument();
      expect(screen.getByText('Total Nodes')).toBeInTheDocument();
      expect(screen.getByText('19,000')).toBeInTheDocument();
      expect(screen.getByText('Relationships')).toBeInTheDocument();
    });
  });

  it('renders node type counts in stats panel', async () => {
    vi.mocked(threatOracleAPI.health).mockResolvedValue({ status: 'ok' });
    vi.mocked(threatOracleAPI.graphStats).mockResolvedValue(mockStats);

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText('969')).toBeInTheDocument();
      expect(screen.getByText('650')).toBeInTheDocument();
      expect(screen.getByText('559')).toBeInTheDocument();
    });

    // Verify stat labels appear in the stats panel
    const statsPanel = document.querySelector('.stats-panel');
    expect(statsPanel).not.toBeNull();
    expect(statsPanel!.textContent).toContain('CWE');
    expect(statsPanel!.textContent).toContain('Technique');
    expect(statsPanel!.textContent).toContain('CAPEC');
  });

  it('performs search when button is clicked', async () => {
    vi.mocked(threatOracleAPI.health).mockResolvedValue({ status: 'ok' });
    vi.mocked(threatOracleAPI.graphStats).mockResolvedValue(mockStats);
    vi.mocked(threatOracleAPI.searchGraph).mockResolvedValue(mockSearchResults);

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText('Total Nodes')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search nodes/i);
    fireEvent.change(searchInput, { target: { value: 'SQL' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(threatOracleAPI.searchGraph).toHaveBeenCalledWith('SQL', 50);
      expect(screen.getByText('SQL Injection')).toBeInTheDocument();
      expect(screen.getByText('CWE-89')).toBeInTheDocument();
    });
  });

  it('shows node detail when a result is clicked', async () => {
    vi.mocked(threatOracleAPI.health).mockResolvedValue({ status: 'ok' });
    vi.mocked(threatOracleAPI.graphStats).mockResolvedValue(mockStats);
    vi.mocked(threatOracleAPI.searchGraph).mockResolvedValue(mockSearchResults);
    vi.mocked(threatOracleAPI.getNode).mockResolvedValue(mockNodeDetail);

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText('Total Nodes')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search nodes/i);
    fireEvent.change(searchInput, { target: { value: 'SQL' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('SQL Injection')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('SQL Injection'));

    await waitFor(() => {
      expect(threatOracleAPI.getNode).toHaveBeenCalledWith('CWE-89');
      expect(screen.getByText('CHILD_OF')).toBeInTheDocument();
    });
  });

  it('performs browse when Browse button is clicked', async () => {
    vi.mocked(threatOracleAPI.health).mockResolvedValue({ status: 'ok' });
    vi.mocked(threatOracleAPI.graphStats).mockResolvedValue(mockStats);
    vi.mocked(threatOracleAPI.listNodes).mockResolvedValue({
      nodes: mockSearchResults.results,
      skip: 0,
      limit: 50,
    });

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText('Total Nodes')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Browse'));

    await waitFor(() => {
      expect(threatOracleAPI.listNodes).toHaveBeenCalledWith({
        label: undefined,
        limit: 50,
      });
      expect(screen.getByText('SQL Injection')).toBeInTheDocument();
    });
  });

  it('shows empty state message before any search', async () => {
    vi.mocked(threatOracleAPI.health).mockResolvedValue({ status: 'ok' });
    vi.mocked(threatOracleAPI.graphStats).mockResolvedValue(mockStats);

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText(/Search or browse/i)).toBeInTheDocument();
    });
  });

  it('shows error message when search fails', async () => {
    vi.mocked(threatOracleAPI.health).mockResolvedValue({ status: 'ok' });
    vi.mocked(threatOracleAPI.graphStats).mockResolvedValue(mockStats);
    vi.mocked(threatOracleAPI.searchGraph).mockRejectedValue(new Error('Search failed'));

    renderKnowledgeGraph();

    await waitFor(() => {
      expect(screen.getByText('Total Nodes')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search nodes/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });
  });
});
