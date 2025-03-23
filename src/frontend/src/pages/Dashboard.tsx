import React from 'react';
import ModelSelector from '@/components/model/ModelSelector';
import { useModelStore } from '@/store/modelStore';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();
  
  return (
    <div className="dashboard">
      <h1>Threat Oracle Dashboard</h1>
      <p className="description">
        Welcome to Threat Oracle, a visual threat modeling tool that creates digital twins of applications and infrastructure using a graph-based approach.
      </p>
      
      <ModelSelector />

      <div className="dashboard-cards">
        <div className="card">
          <h2>Technical Assets</h2>
          <p>Manage your technical assets such as servers, applications, databases, and more.</p>
          <div className="card-footer">
            <button onClick={() => window.location.href = '/technical-assets'}>View Assets</button>
          </div>
        </div>

        <div className="card">
          <h2>Trust Boundaries</h2>
          <p>Define and manage trust boundaries such as network segments, security zones, and organizational boundaries.</p>
          <div className="card-footer">
            <button onClick={() => window.location.href = '/trust-boundaries'}>View Boundaries</button>
          </div>
        </div>

        <div className="card">
          <h2>Data Flows</h2>
          <p>Map data flows between technical assets to understand how information moves through your system.</p>
          <div className="card-footer">
            <button onClick={() => window.location.href = '/data-flows'}>View Flows</button>
          </div>
        </div>

        <div className="card">
          <h2>Visualization</h2>
          <p>Visualize your threat model as an interactive graph to identify potential security issues.</p>
          <div className="card-footer">
            <button onClick={() => window.location.href = '/visualization'}>View Graph</button>
          </div>
        </div>
      </div>

      <div className="getting-started">
        <h2>Getting Started</h2>
        <ol>
          <li>Create technical assets to represent your system components</li>
          <li>Define trust boundaries to group related assets</li>
          <li>Map data flows between assets to show information exchange</li>
          <li>Use the visualization to analyze your threat model</li>
        </ol>
      </div>
    </div>
  );
};

export default Dashboard;
