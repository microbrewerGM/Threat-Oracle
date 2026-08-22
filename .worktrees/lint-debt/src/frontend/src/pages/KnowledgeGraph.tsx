import React, { useState, useEffect, useCallback } from 'react';
import { threatOracleAPI, GraphNode, GraphStatsResponse, NodeDetailResponse } from '@/services/api';
import './KnowledgeGraph.css';

const NODE_TYPE_COLORS: Record<string, string> = {
  CWE: '#e15759',
  Technique: '#4e79a7',
  Tactic: '#59a14f',
  Mitigation: '#76b7b2',
  CAPEC: '#f28e2c',
  Group: '#af7aa1',
  Software: '#edc949',
  Campaign: '#ff9da7',
  DataSource: '#9c755f',
  DataComponent: '#bab0ab',
};

function getNodeId(node: GraphNode): string {
  return node.cwe_id || node.attack_id || node.capec_id || '';
}

function NodeTypeBadge({ label }: { label: string }) {
  const color = NODE_TYPE_COLORS[label] || '#6c757d';
  return (
    <span className="node-type-badge" style={{ backgroundColor: color }}>
      {label}
    </span>
  );
}

function getRelName(obj: Record<string, unknown>): string {
  return String(obj?.name || obj?.cwe_id || obj?.attack_id || obj?.capec_id || '');
}

function NodeDetailPanel({ detail }: { detail: NodeDetailResponse }) {
  const node = detail.node as Record<string, unknown>;
  const nodeId = getNodeId(node as GraphNode);

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h2>{String(node.name || '')}</h2>
        <span className="node-id-large">{nodeId}</span>
      </div>

      {Boolean(node.description) && (
        <div className="detail-section">
          <h3>Description</h3>
          <p>{String(node.description)}</p>
        </div>
      )}

      {detail.relationships.outgoing.length > 0 && (
        <div className="detail-section">
          <h3>Outgoing Relationships ({detail.relationships.outgoing.length})</h3>
          <div className="relationships-list">
            {detail.relationships.outgoing.slice(0, 20).map((rel, i) => (
              <div key={i} className="relationship-item">
                <span className="rel-type">{rel.type}</span>
                <span className="rel-arrow">&rarr;</span>
                <span className="rel-target">
                  {rel.target_labels?.map((l) => (
                    <NodeTypeBadge key={l} label={l} />
                  ))}{' '}
                  {getRelName(rel.target as Record<string, unknown>)}
                </span>
              </div>
            ))}
            {detail.relationships.outgoing.length > 20 && (
              <p className="truncated">...and {detail.relationships.outgoing.length - 20} more</p>
            )}
          </div>
        </div>
      )}

      {detail.relationships.incoming.length > 0 && (
        <div className="detail-section">
          <h3>Incoming Relationships ({detail.relationships.incoming.length})</h3>
          <div className="relationships-list">
            {detail.relationships.incoming.slice(0, 20).map((rel, i) => (
              <div key={i} className="relationship-item">
                <span className="rel-target">
                  {getRelName(rel.source as Record<string, unknown>)}
                </span>
                <span className="rel-arrow">&rarr;</span>
                <span className="rel-type">{rel.type}</span>
              </div>
            ))}
            {detail.relationships.incoming.length > 20 && (
              <p className="truncated">...and {detail.relationships.incoming.length - 20} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const KnowledgeGraph: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<GraphNode[]>([]);
  const [stats, setStats] = useState<GraphStatsResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDetailResponse | null>(null);
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // Check API availability and load stats on mount
  useEffect(() => {
    const init = async () => {
      try {
        await threatOracleAPI.health();
        setApiAvailable(true);
        setStatsLoading(true);
        const statsData = await threatOracleAPI.graphStats();
        setStats(statsData);
      } catch {
        setApiAvailable(false);
      } finally {
        setStatsLoading(false);
      }
    };
    init();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      const data = await threatOracleAPI.searchGraph(searchQuery, 50);
      setResults(data.results);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleBrowse = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      const data = await threatOracleAPI.listNodes({
        label: labelFilter || undefined,
        limit: 50,
      });
      setResults(data.nodes);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Browse failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [labelFilter]);

  const handleNodeClick = useCallback(async (node: GraphNode) => {
    const nodeId = getNodeId(node);
    if (!nodeId) return;
    try {
      const detail = await threatOracleAPI.getNode(nodeId);
      setSelectedNode(detail);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load node details');
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  if (apiAvailable === false) {
    return (
      <div className="knowledge-graph-page">
        <h1>Knowledge Graph Explorer</h1>
        <div className="api-unavailable">
          <h2>API Not Available</h2>
          <p>The Threat Oracle API is not running. Start it with:</p>
          <code>docker compose -f docker-compose.dev.yml up api</code>
          <p>The API serves the CWE, ATT&CK, and CAPEC knowledge graph on port 8000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-graph-page">
      <h1>Knowledge Graph Explorer</h1>
      <p className="description">
        Browse the security knowledge graph containing CWE weaknesses, ATT&CK techniques, and CAPEC attack patterns.
      </p>

      {/* Stats Panel */}
      {stats && !statsLoading && (
        <div className="stats-panel">
          <div className="stat-item">
            <span className="stat-value">{stats.total_nodes.toLocaleString()}</span>
            <span className="stat-label">Total Nodes</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.total_relationships.toLocaleString()}</span>
            <span className="stat-label">Relationships</span>
          </div>
          {Object.entries(stats.node_counts).map(([label, count]) => (
            <div
              key={label}
              className="stat-item clickable"
              onClick={() => {
                setLabelFilter(label);
                setSearchQuery('');
              }}
            >
              <span className="stat-value">{count.toLocaleString()}</span>
              <span className="stat-label">{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filter */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search nodes by name or description (e.g., SQL injection, T1059)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        <button onClick={handleSearch} disabled={loading || !searchQuery.trim()} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
        <select
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Types</option>
          {stats && Object.keys(stats.node_counts).map((label) => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>
        <button onClick={handleBrowse} disabled={loading} className="browse-button">
          Browse
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="content-area">
        {/* Results List */}
        <div className="results-panel">
          {results.length > 0 ? (
            <>
              <div className="results-header">
                <span>{results.length} results</span>
              </div>
              <div className="results-list">
                {results.map((node, i) => {
                  const nodeId = getNodeId(node);
                  return (
                    <div
                      key={nodeId || i}
                      className={`result-card card ${selectedNode?.node && getNodeId(selectedNode.node as GraphNode) === nodeId ? 'selected' : ''}`}
                      onClick={() => handleNodeClick(node)}
                    >
                      <div className="result-header">
                        <span className="node-id">{nodeId}</span>
                        {node._labels?.map((label) => (
                          <NodeTypeBadge key={label} label={label} />
                        ))}
                      </div>
                      <h3 className="result-name">{node.name}</h3>
                      {node.description && (
                        <p className="result-description">
                          {String(node.description).slice(0, 150)}
                          {String(node.description).length > 150 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : !loading ? (
            <div className="empty-results">
              <p>Search or browse the knowledge graph to see results.</p>
            </div>
          ) : null}
        </div>

        {/* Node Detail Panel */}
        {selectedNode && selectedNode.node && (
          <NodeDetailPanel detail={selectedNode} />
        )}
      </div>
    </div>
  );
};

export default KnowledgeGraph;
