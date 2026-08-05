/**
 * DetailPanel.tsx — Slide-out right panel showing detail for the selected
 * graph element (node, edge, or threat).
 *
 * Reads selection state from graphLayerStore, model data from modelStore,
 * and threat data from graphLayerStore.threats (populated by ThreatGraph).
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useModelStore } from '@/store/modelStore';
import { useGraphLayerStore } from '@/store/graphLayerStore';
import { STRIDE_COLORS, SEVERITY_COLORS } from '@/components/graph/graphHelpers';
import type { ThreatItem } from '@/services/api';
import './DetailPanel.css';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function severityClass(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'critical') return 'detail-badge--critical';
  if (s === 'high') return 'detail-badge--high';
  if (s === 'medium') return 'detail-badge--medium';
  if (s === 'low') return 'detail-badge--low';
  return 'detail-badge--info';
}

function strideCategoryLabel(cat: string): string {
  return cat
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="detail-section-label">{label}</div>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-row-key">{label}</span>
    <span className="detail-row-value">{value}</span>
  </div>
);

// ---------------------------------------------------------------------------
// Node detail
// ---------------------------------------------------------------------------

const NodeDetail: React.FC = () => {
  const { selectedNodeId, threats, setSelectedThreat } = useGraphLayerStore();
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();

  const asset = useMemo(() => {
    if (!currentModel || !selectedNodeId) return null;
    return currentModel.technicalAssets.find((a) => a.id === selectedNodeId) ?? null;
  }, [currentModel, selectedNodeId]);

  // Related data flows
  const relatedFlows = useMemo(() => {
    if (!currentModel || !selectedNodeId) return [];
    return currentModel.dataFlows.filter(
      (f) => f.source_id === selectedNodeId || f.target_id === selectedNodeId,
    );
  }, [currentModel, selectedNodeId]);

  // Threats affecting this node
  const nodeThreats = useMemo(() => {
    if (!asset || threats.length === 0) return [];
    const assetNameLower = asset.name.toLowerCase();
    return threats.filter((t) =>
      t.affected_assets.some((a) => a.toLowerCase() === assetNameLower),
    );
  }, [asset, threats]);

  if (!asset) return null;

  return (
    <>
      <div className="detail-panel-header">
        <div className="detail-panel-header-content">
          <div className="detail-panel-title">{asset.name}</div>
          <span className="detail-badge detail-badge--type">{asset.type}</span>
        </div>
      </div>

      <div className="detail-panel-content">
        {/* Basic info */}
        <div className="detail-section">
          <SectionLabel label="Basic Info" />
          <Row label="ID" value={asset.id} />
          <Row label="Type" value={asset.type} />
          {asset.owner && <Row label="Owner" value={asset.owner} />}
          {asset.criticality && (
            <Row
              label="Criticality"
              value={
                <span className={`detail-badge ${severityClass(asset.criticality)}`}>
                  {asset.criticality}
                </span>
              }
            />
          )}
          {asset.version && <Row label="Version" value={asset.version} />}
        </div>

        {/* Tech stack */}
        {asset.technology_stack && asset.technology_stack.length > 0 && (
          <div className="detail-section">
            <SectionLabel label="Tech Stack" />
            <div className="detail-tag-list">
              {asset.technology_stack.map((tech) => (
                <span key={tech} className="detail-tag">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Related data flows */}
        {relatedFlows.length > 0 && (
          <div className="detail-section">
            <SectionLabel label={`Related Data Flows (${relatedFlows.length})`} />
            {relatedFlows.map((flow) => {
              const sourceName =
                currentModel?.technicalAssets.find((a) => a.id === flow.source_id)?.name ??
                flow.source_id;
              const targetName =
                currentModel?.technicalAssets.find((a) => a.id === flow.target_id)?.name ??
                flow.target_id;
              return (
                <div key={flow.id} className="detail-row" style={{ flexDirection: 'column', gap: 2 }}>
                  <span className="detail-row-value" style={{ fontSize: 11 }}>
                    {flow.name || flow.protocol.toUpperCase()}
                  </span>
                  <span className="detail-row-key" style={{ fontSize: 10 }}>
                    {sourceName} → {targetName}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Associated threats */}
        {nodeThreats.length > 0 && (
          <div className="detail-section">
            <SectionLabel label={`Threats (${nodeThreats.length})`} />
            {nodeThreats.map((threat) => (
              <div
                key={threat.threat_id}
                className="detail-threat-item"
                onClick={() => setSelectedThreat(threat.threat_id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedThreat(threat.threat_id);
                }}
              >
                <span className={`detail-badge ${severityClass(threat.severity)}`}>
                  {threat.severity.charAt(0).toUpperCase()}
                </span>
                <span className="detail-threat-item-title">{threat.title}</span>
                <span className="detail-threat-item-score">{threat.risk_score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Edge detail
// ---------------------------------------------------------------------------

const EdgeDetail: React.FC = () => {
  const { selectedEdgeId } = useGraphLayerStore();
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();

  const flow = useMemo(() => {
    if (!currentModel || !selectedEdgeId) return null;
    return currentModel.dataFlows.find((f) => f.id === selectedEdgeId) ?? null;
  }, [currentModel, selectedEdgeId]);

  const sourceName = useMemo(() => {
    if (!currentModel || !flow) return '';
    return currentModel.technicalAssets.find((a) => a.id === flow.source_id)?.name ?? flow.source_id;
  }, [currentModel, flow]);

  const targetName = useMemo(() => {
    if (!currentModel || !flow) return '';
    return currentModel.technicalAssets.find((a) => a.id === flow.target_id)?.name ?? flow.target_id;
  }, [currentModel, flow]);

  const boundaryName = useMemo(() => {
    if (!currentModel || !flow?.trust_boundary_id) return null;
    return (
      currentModel.trustBoundaries.find((b) => b.id === flow.trust_boundary_id)?.name ??
      flow.trust_boundary_id
    );
  }, [currentModel, flow]);

  if (!flow) return null;

  return (
    <>
      <div className="detail-panel-header">
        <div className="detail-panel-header-content">
          <div className="detail-panel-title">{flow.name || 'Protocol Flow'}</div>
          <span className="detail-badge detail-badge--type">{flow.protocol.toUpperCase()}</span>
        </div>
      </div>

      <div className="detail-panel-content">
        {/* Connection info */}
        <div className="detail-section">
          <SectionLabel label="Connection" />
          <Row label="Protocol" value={flow.protocol.toUpperCase()} />
          {flow.port != null && <Row label="Port" value={String(flow.port)} />}
          <Row
            label="Encrypted"
            value={
              <span className={flow.is_encrypted ? 'detail-encrypted-yes' : 'detail-encrypted-no'}>
                {flow.is_encrypted ? 'Yes' : 'No'}
              </span>
            }
          />
          {flow.authentication_method && (
            <Row label="Auth" value={flow.authentication_method} />
          )}
        </div>

        {/* Security */}
        <div className="detail-section">
          <SectionLabel label="Security" />
          <Row
            label="Crosses Boundary"
            value={flow.crosses_trust_boundary ? 'Yes' : 'No'}
          />
          {boundaryName && <Row label="Boundary" value={boundaryName} />}
        </div>

        {/* Source -> Target */}
        <div className="detail-section">
          <SectionLabel label="Direction" />
          <div className="detail-flow-direction">
            <span>{sourceName}</span>
            <span className="detail-flow-arrow">→</span>
            <span>{targetName}</span>
          </div>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Threat detail
// ---------------------------------------------------------------------------

const ThreatDetail: React.FC = () => {
  const { selectedThreatId, threats } = useGraphLayerStore();

  const threat: ThreatItem | null = useMemo(() => {
    if (!selectedThreatId || threats.length === 0) return null;
    return threats.find((t) => t.threat_id === selectedThreatId) ?? null;
  }, [selectedThreatId, threats]);

  if (!threat) return null;

  const strideKey = threat.stride_category.toLowerCase().replace(/ /g, '_');

  return (
    <>
      <div className="detail-panel-header">
        <div className="detail-panel-header-content">
          <div className="detail-panel-title">{threat.title}</div>
          <span className={`detail-badge ${severityClass(threat.severity)}`}>
            {threat.severity}
          </span>
        </div>
      </div>

      <div className="detail-panel-content">
        {/* STRIDE + scores */}
        <div className="detail-section">
          <SectionLabel label="Classification" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
            <span
              className={`detail-stride-chip detail-stride-chip--${strideKey}`}
              style={{
                borderColor: STRIDE_COLORS[strideKey] || undefined,
                border: `1px solid ${STRIDE_COLORS[strideKey] || '#8B949E'}`,
              }}
            >
              {strideCategoryLabel(threat.stride_category)}
            </span>
          </div>
          <Row label="Risk Score" value={threat.risk_score.toFixed(1)} />
          <Row label="Likelihood" value={threat.likelihood} />
          <Row label="Confidence" value={`${(threat.confidence * 100).toFixed(0)}%`} />
        </div>

        {/* Description */}
        <div className="detail-section">
          <SectionLabel label="Description" />
          <div className="detail-text-block">{threat.description}</div>
        </div>

        {/* Attack vector */}
        {threat.attack_vector && (
          <div className="detail-section">
            <SectionLabel label="Attack Vector" />
            <div className="detail-text-block">{threat.attack_vector}</div>
          </div>
        )}

        {/* Remediation */}
        {threat.remediation && (
          <div className="detail-section">
            <SectionLabel label="Remediation" />
            <div className="detail-text-block">{threat.remediation}</div>
          </div>
        )}

        {/* CWE references */}
        {threat.cwe_ids.length > 0 && (
          <div className="detail-section">
            <SectionLabel label="CWE References" />
            <div className="detail-tag-list">
              {threat.cwe_ids.map((cwe) => (
                <Link
                  key={cwe}
                  to={`/knowledge-graph?search=${encodeURIComponent(cwe)}`}
                  className="detail-link detail-tag"
                  style={{ color: SEVERITY_COLORS.info }}
                >
                  {cwe}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ATT&CK techniques */}
        {threat.attack_technique_ids.length > 0 && (
          <div className="detail-section">
            <SectionLabel label="ATT&CK Techniques" />
            <div className="detail-tag-list">
              {threat.attack_technique_ids.map((tid) => (
                <Link
                  key={tid}
                  to={`/knowledge-graph?search=${encodeURIComponent(tid)}`}
                  className="detail-link detail-tag"
                  style={{ color: SEVERITY_COLORS.info }}
                >
                  {tid}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CAPEC IDs */}
        {threat.capec_ids.length > 0 && (
          <div className="detail-section">
            <SectionLabel label="CAPEC IDs" />
            <div className="detail-tag-list">
              {threat.capec_ids.map((cid) => (
                <span key={cid} className="detail-tag">
                  {cid}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Affected assets */}
        {threat.affected_assets.length > 0 && (
          <div className="detail-section">
            <SectionLabel label="Affected Assets" />
            <div className="detail-asset-list">
              {threat.affected_assets.map((name) => (
                <span key={name} className="detail-asset-item">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main DetailPanel
// ---------------------------------------------------------------------------

const DetailPanel: React.FC = () => {
  const { selectedNodeId, selectedEdgeId, selectedThreatId, clearSelection } =
    useGraphLayerStore();

  const isOpen = Boolean(selectedNodeId || selectedEdgeId || selectedThreatId);

  return (
    <div className="detail-panel-overlay">
      <div className={`detail-panel${isOpen ? ' detail-panel--open' : ''}`}>
        {isOpen && (
          <button
            className="detail-panel-close"
            onClick={clearSelection}
            type="button"
            title="Close panel"
            style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
          >
            &#x2715;
          </button>
        )}
        {selectedThreatId && <ThreatDetail />}
        {selectedEdgeId && !selectedThreatId && <EdgeDetail />}
        {selectedNodeId && !selectedEdgeId && !selectedThreatId && <NodeDetail />}
      </div>
    </div>
  );
};

export default DetailPanel;
