import React from 'react';
import SimpleGraph from '@/components/graph/SimpleGraph';
import { getGraphNodes, getGraphEdges } from '@/store/sampleData';
import './Visualization.css';

const Visualization: React.FC = () => {
  const nodes = getGraphNodes();
  const edges = getGraphEdges();

  return (
    <div className="visualization-page">
      <h1>Threat Model Visualization</h1>
      <p className="description">
        This is a simple visualization of the threat model using a graph-based approach.
        Nodes represent technical assets and edges represent data flows between them.
      </p>
      
      <div className="graph-container">
        <SimpleGraph nodes={nodes} edges={edges} />
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
