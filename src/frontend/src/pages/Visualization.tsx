/**
 * Visualization.tsx — Full-viewport dark layout hosting the ThreatGraph.
 *
 * Compact topbar with inline model selector, graph fills remaining space.
 */

import React from 'react';
import ThreatGraph from '@/components/graph/ThreatGraph';
import LayerControls from '@/components/graph/LayerControls';
import DetailPanel from '@/components/graph/DetailPanel';
import { useModelStore } from '@/store/modelStore';
import './Visualization.css';

const Visualization: React.FC = () => {
  const { models, currentModelId, setCurrentModel, getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentModel(e.target.value);
  };

  return (
    <div className="visualization-page">
      {/* --- Compact dark topbar --- */}
      <div className="visualization-topbar">
        <label htmlFor="viz-model-select">Model:</label>
        <select
          id="viz-model-select"
          value={currentModelId || ''}
          onChange={handleModelChange}
        >
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} (v{model.version})
            </option>
          ))}
        </select>

        {currentModel && (
          <div className="model-stats-compact">
            <span>
              <span className="stat-count">{currentModel.technicalAssets.length}</span> assets
            </span>
            <span>
              <span className="stat-count">{currentModel.dataFlows.length}</span> flows
            </span>
            <span>
              <span className="stat-count">{currentModel.trustBoundaries.length}</span> boundaries
            </span>
          </div>
        )}
      </div>

      {/* --- Graph area --- */}
      {currentModel ? (
        <div className="visualization-graph-area">
          <ThreatGraph />
          <LayerControls />
          <DetailPanel />
        </div>
      ) : (
        <div className="visualization-empty">
          <div className="empty-icon">&#x2B22;</div>
          <p>No model selected. Choose a model above to visualize.</p>
        </div>
      )}
    </div>
  );
};

export default Visualization;
