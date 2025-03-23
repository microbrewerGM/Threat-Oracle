import React from 'react';
import SimpleGraph from '@/components/graph/SimpleGraph';
import ModelSelector from '@/components/model/ModelSelector';
import { useModelStore } from '@/store/modelStore';
import './Visualization.css';

const Visualization: React.FC = () => {
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();
  
  // Transform model data into graph nodes and edges
  const nodes = currentModel ? currentModel.technicalAssets.map(asset => ({
    id: asset.id,
    name: asset.name,
    type: asset.type
  })) : [];
  
  const edges = currentModel ? currentModel.dataFlows.map(flow => ({
    id: flow.id,
    source: flow.source_id,
    target: flow.target_id,
    label: flow.protocol.toUpperCase()
  })) : [];

  return (
    <div className="visualization-page">
      <h1>Threat Model Visualization</h1>
      <p className="description">
        This is a simple visualization of the threat model using a graph-based approach.
        Nodes represent technical assets and edges represent data flows between them.
      </p>
      
      <ModelSelector />
      
      <div className="graph-container">
        {nodes.length > 0 && edges.length > 0 ? (
          <SimpleGraph nodes={nodes} edges={edges} />
        ) : (
          <div className="empty-graph">
            <p>No data available to visualize.</p>
          </div>
        )}
      </div>
      
      <div className="legend">
        <h2>Legend</h2>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color node-server"></div>
            <span>Server</span>
          </div>
          <div className="legend-item">
            <div className="legend-color node-application"></div>
            <span>Application</span>
          </div>
          <div className="legend-item">
            <div className="legend-color node-database"></div>
            <span>Database</span>
          </div>
          <div className="legend-item">
            <div className="legend-color node-service"></div>
            <span>Service</span>
          </div>
        </div>
      </div>
      
      <div className="instructions">
        <h2>Instructions</h2>
        <ul>
          <li>Drag nodes to reposition them</li>
          <li>Hover over nodes to see their names</li>
          <li>The graph will automatically layout using a force-directed algorithm</li>
        </ul>
      </div>
    </div>
  );
};

export default Visualization;
