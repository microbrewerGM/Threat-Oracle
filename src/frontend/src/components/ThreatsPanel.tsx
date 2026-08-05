import React, { useState } from 'react';

interface Threat {
  threat_id: string;
  title: string;
  stride_category: string;
  severity: string;
  likelihood: string;
  risk_score: number;
  attack_vector: string;
  description: string;
  remediation: string;
  confidence: number;
  cwe_ids: string[];
  capec_ids: string[];
  attack_technique_ids: string[];
  affected_assets: string[];
}

interface ThreatsPanelProps {
  threats: Threat[];
  loading?: boolean;
}

const STRIDE_LABELS: Record<string, string> = {
  spoofing: 'Spoofing',
  tampering: 'Tampering',
  repudiation: 'Repudiation',
  information_disclosure: 'Information Disclosure',
  denial_of_service: 'Denial of Service',
  elevation_of_privilege: 'Elevation of Privilege',
};

const STRIDE_ORDER = [
  'spoofing',
  'tampering',
  'repudiation',
  'information_disclosure',
  'denial_of_service',
  'elevation_of_privilege',
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#ca8a04',
  low: '#2563eb',
  info: '#6b7280',
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
  },
  loadingSpinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '1rem',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280',
  },
  categorySection: {
    marginBottom: '24px',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  },
  categoryTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#1f2937',
  },
  categoryCount: {
    background: '#e5e7eb',
    borderRadius: '12px',
    padding: '2px 8px',
    fontSize: '0.8rem',
    color: '#4b5563',
  },
  threatCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    background: '#fafafa',
  },
  threatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
  },
  threatTitle: {
    margin: 0,
    fontSize: '0.95rem',
    color: '#1f2937',
    flex: 1,
  },
  badgeRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  severityBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  },
  riskScore: {
    fontSize: '0.8rem',
    color: '#4b5563',
    fontWeight: 500,
  },
  likelihood: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  expandToggle: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#6b7280',
    padding: '0 4px',
  },
  detailsSection: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
  },
  detailBlock: {
    marginBottom: '10px',
  },
  detailLabel: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#4b5563',
    marginBottom: '4px',
  },
  detailText: {
    fontSize: '0.85rem',
    color: '#374151',
    lineHeight: 1.5,
    margin: 0,
  },
  tagRow: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
    marginTop: '4px',
  },
  tag: {
    background: '#dbeafe',
    color: '#1d4ed8',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    textDecoration: 'none',
  },
  attackTag: {
    background: '#fce7f3',
    color: '#be185d',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    textDecoration: 'none',
  },
  assetTag: {
    background: '#e5e7eb',
    color: '#374151',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.75rem',
  },
};

const ThreatsPanel: React.FC<ThreatsPanelProps> = ({ threats, loading }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return <div style={styles.loadingSpinner}>Loading threats...</div>;
  }

  if (threats.length === 0) {
    return <div style={styles.emptyState}>No threats found. Run an analysis to discover potential threats.</div>;
  }

  const grouped: Record<string, Threat[]> = {};
  for (const threat of threats) {
    const cat = threat.stride_category || 'unknown';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(threat);
  }

  const orderedCategories = STRIDE_ORDER.filter((cat) => grouped[cat]);
  const extraCategories = Object.keys(grouped).filter((cat) => !STRIDE_ORDER.includes(cat));

  return (
    <div style={styles.container}>
      {[...orderedCategories, ...extraCategories].map((category) => (
        <div key={category} style={styles.categorySection}>
          <div style={styles.categoryHeader}>
            <h3 style={styles.categoryTitle}>{STRIDE_LABELS[category] || category}</h3>
            <span style={styles.categoryCount}>{grouped[category].length}</span>
          </div>
          {grouped[category].map((threat) => {
            const isExpanded = expandedIds.has(threat.threat_id);
            return (
              <div key={threat.threat_id} style={styles.threatCard}>
                <div style={styles.threatHeader} onClick={() => toggleExpand(threat.threat_id)}>
                  <h4 style={styles.threatTitle}>{threat.title}</h4>
                  <div style={styles.badgeRow}>
                    <span
                      style={{
                        ...styles.severityBadge,
                        backgroundColor: SEVERITY_COLORS[threat.severity] || '#6b7280',
                      }}
                    >
                      {threat.severity}
                    </span>
                    <span style={styles.riskScore}>Risk: {threat.risk_score}</span>
                    <span style={styles.likelihood}>{threat.likelihood}</span>
                    <button style={styles.expandToggle}>{isExpanded ? '\u25B2' : '\u25BC'}</button>
                  </div>
                </div>
                {isExpanded && (
                  <div style={styles.detailsSection}>
                    <div style={styles.detailBlock}>
                      <div style={styles.detailLabel}>Description</div>
                      <p style={styles.detailText}>{threat.description}</p>
                    </div>
                    <div style={styles.detailBlock}>
                      <div style={styles.detailLabel}>Attack Vector</div>
                      <p style={styles.detailText}>{threat.attack_vector}</p>
                    </div>
                    <div style={styles.detailBlock}>
                      <div style={styles.detailLabel}>Remediation</div>
                      <p style={styles.detailText}>{threat.remediation}</p>
                    </div>
                    {threat.cwe_ids.length > 0 && (
                      <div style={styles.detailBlock}>
                        <div style={styles.detailLabel}>CWE References</div>
                        <div style={styles.tagRow}>
                          {threat.cwe_ids.map((cwe) => (
                            <a
                              key={cwe}
                              href={`/knowledge-graph?search=${encodeURIComponent(cwe)}`}
                              style={styles.tag}
                            >
                              {cwe}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {threat.attack_technique_ids.length > 0 && (
                      <div style={styles.detailBlock}>
                        <div style={styles.detailLabel}>ATT&CK Techniques</div>
                        <div style={styles.tagRow}>
                          {threat.attack_technique_ids.map((tid) => (
                            <a
                              key={tid}
                              href={`/knowledge-graph?search=${encodeURIComponent(tid)}`}
                              style={styles.attackTag}
                            >
                              {tid}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {threat.affected_assets.length > 0 && (
                      <div style={styles.detailBlock}>
                        <div style={styles.detailLabel}>Affected Assets</div>
                        <div style={styles.tagRow}>
                          {threat.affected_assets.map((asset) => (
                            <span key={asset} style={styles.assetTag}>
                              {asset}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={styles.detailBlock}>
                      <div style={styles.detailLabel}>
                        Confidence: {Math.round(threat.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default ThreatsPanel;
