import React from 'react';
import ModelSelector from '@/components/model/ModelSelector';
import './DataAssets.css';

const DataAssets: React.FC = () => {
  return (
    <div className="data-assets-page">
      <h1>Data Assets</h1>
      <p className="description">
        Data assets represent the information that flows through your system, such as personal data, financial records, and configuration data.
      </p>
      
      <ModelSelector />
      
      <div className="placeholder-content">
        <div className="placeholder-icon">📊</div>
        <h2>Coming Soon</h2>
        <p>
          The Data Assets feature is currently under development. This will allow you to define and manage the different types of data in your system.
        </p>
        <p>
          Data assets will be linked to data flows to show how information moves through your system and which security controls are needed to protect it.
        </p>
        
        <div className="placeholder-features">
          <h3>Planned Features:</h3>
          <ul>
            <li>Define data classification levels (public, internal, confidential, etc.)</li>
            <li>Specify data types (PII, financial, health, etc.)</li>
            <li>Link data assets to data flows</li>
            <li>Identify data protection requirements</li>
            <li>Track data lifecycle (creation, storage, processing, transmission, deletion)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DataAssets;
