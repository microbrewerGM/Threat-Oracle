/**
 * Threat Oracle API client.
 *
 * Calls are proxied through Vite dev server (/api → localhost:8000).
 * In production, the API base URL should be configured via env var.
 */

const API_BASE = '/api/v1';

interface GraphNode {
  _labels: string[];
  name?: string;
  description?: string;
  cwe_id?: string;
  attack_id?: string;
  capec_id?: string;
  [key: string]: unknown;
}

interface GraphStatsResponse {
  node_counts: Record<string, number>;
  total_nodes: number;
  relationship_counts: Record<string, number>;
  total_relationships: number;
}

interface NodesResponse {
  nodes: GraphNode[];
  skip: number;
  limit: number;
}

interface NodeDetailResponse {
  node: GraphNode;
  relationships: {
    outgoing: Array<{ type: string; target: Record<string, unknown>; target_labels: string[] }>;
    incoming: Array<{ type: string; source: Record<string, unknown>; source_labels: string[] }>;
  };
}

interface SearchResponse {
  query: string;
  results: GraphNode[];
  count: number;
}

interface ImportResponse {
  source: string;
  status: string;
  nodes_imported: number;
  relationships_imported?: number;
  cwe_relationships?: number;
  attack_relationships?: number;
}

interface HealthResponse {
  status: string;
  database?: string;
  error?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API error ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export const threatOracleAPI = {
  // Health
  health: () => apiFetch<HealthResponse>('/health'),
  healthDb: () => apiFetch<HealthResponse>('/health/db'),

  // Graph queries
  graphStats: () => apiFetch<GraphStatsResponse>(`${API_BASE}/graph/stats`),

  listNodes: (params?: { label?: string; search?: string; skip?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.label) searchParams.set('label', params.label);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
    if (params?.limit !== undefined) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();
    return apiFetch<NodesResponse>(`${API_BASE}/graph/nodes${qs ? `?${qs}` : ''}`);
  },

  getNode: (nodeId: string) =>
    apiFetch<NodeDetailResponse>(`${API_BASE}/graph/nodes/${encodeURIComponent(nodeId)}`),

  searchGraph: (query: string, limit?: number) => {
    const searchParams = new URLSearchParams({ q: query });
    if (limit !== undefined) searchParams.set('limit', String(limit));
    return apiFetch<SearchResponse>(`${API_BASE}/graph/search?${searchParams}`);
  },

  // Import triggers
  triggerImport: (source: 'cwe' | 'attack' | 'capec') =>
    apiFetch<ImportResponse>(`${API_BASE}/import/trigger/${source}`, { method: 'POST' }),
};

export type {
  GraphNode,
  GraphStatsResponse,
  NodesResponse,
  NodeDetailResponse,
  SearchResponse,
  ImportResponse,
  HealthResponse,
};
