/**
 * LayerControls.tsx — Floating glassmorphism panel for toggling graph layers.
 *
 * Reads/writes layer visibility from graphLayerStore.
 * Shows STRIDE sub-toggles when the "STRIDE Threats" layer is enabled.
 */

import React from 'react';
import { useGraphLayerStore, LayerKey, StrideCategory } from '@/store/graphLayerStore';
import { STRIDE_COLORS } from '@/components/graph/graphHelpers';
import './LayerControls.css';

interface LayerControlsProps {
  threatCount?: number;
}

// ---------------------------------------------------------------------------
// Layer config
// ---------------------------------------------------------------------------

interface LayerDef {
  key: LayerKey;
  label: string;
  color: string;
  locked?: boolean;
}

const LAYERS: LayerDef[] = [
  { key: 'trustBoundaries', label: 'Trust Boundaries', color: '#FFA94D' },
  { key: 'dataFlows', label: 'Data Flows', color: '#8B949E' },
  { key: 'architecture', label: 'Architecture', color: '#00DFFF', locked: true },
  { key: 'strideThreats', label: 'STRIDE Threats', color: '#FF6B6B' },
  { key: 'riskHeatmap', label: 'Risk Heatmap', color: '#FFD700' },
  { key: 'knowledgeGraph', label: 'Knowledge Graph', color: '#DA77F2' },
];

// ---------------------------------------------------------------------------
// STRIDE sub-toggle config
// ---------------------------------------------------------------------------

interface StrideDef {
  key: StrideCategory;
  letter: string;
  colorKey: string; // key into STRIDE_COLORS
}

const STRIDE_CATEGORIES: StrideDef[] = [
  { key: 'spoofing', letter: 'S', colorKey: 'spoofing' },
  { key: 'tampering', letter: 'T', colorKey: 'tampering' },
  { key: 'repudiation', letter: 'R', colorKey: 'repudiation' },
  { key: 'informationDisclosure', letter: 'I', colorKey: 'information_disclosure' },
  { key: 'denialOfService', letter: 'D', colorKey: 'denial_of_service' },
  { key: 'elevationOfPrivilege', letter: 'E', colorKey: 'elevation_of_privilege' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LayerControls: React.FC<LayerControlsProps> = ({ threatCount }) => {
  const store = useGraphLayerStore();

  return (
    <div className="layer-controls">
      <div className="layer-controls-title">Layers</div>

      {LAYERS.map((layer) => {
        const checked = store[layer.key];
        return (
          <React.Fragment key={layer.key}>
            <label
              className={`layer-row${layer.locked ? ' disabled' : ''}`}
            >
              <input
                type="checkbox"
                className="layer-checkbox"
                checked={checked}
                disabled={layer.locked}
                onChange={() => store.toggleLayer(layer.key)}
              />
              <span
                className="layer-indicator"
                style={{ backgroundColor: layer.color }}
              />
              <span className="layer-label">
                {layer.label}
                {layer.key === 'strideThreats' && threatCount !== undefined && threatCount > 0 && (
                  <span className="layer-threat-count"> ({threatCount})</span>
                )}
              </span>
            </label>

            {/* STRIDE sub-toggles when STRIDE Threats is active */}
            {layer.key === 'strideThreats' && checked && (
              <div className="stride-sub-toggles">
                {STRIDE_CATEGORIES.map((cat) => {
                  const color = STRIDE_COLORS[cat.colorKey] || '#8B949E';
                  return (
                    <label key={cat.key} className="stride-toggle">
                      <input
                        type="checkbox"
                        className="stride-checkbox"
                        style={{ color }}
                        checked={store[cat.key]}
                        onChange={() => store.toggleStrideCategory(cat.key)}
                      />
                      <span className="stride-letter" style={{ color }}>
                        {cat.letter}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default LayerControls;
