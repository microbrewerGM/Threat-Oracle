import React from 'react';
import { useModelStore } from '@/store/modelStore';
import './ModelSelector.css';

const ModelSelector: React.FC = () => {
  const { models, currentModelId, setCurrentModel } = useModelStore();
  
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentModel(e.target.value);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  return (
    <div className="model-selector">
      <div className="model-selector-header">
        <label htmlFor="model-select">Current Model:</label>
        <select 
          id="model-select" 
          value={currentModelId || ''} 
          onChange={handleModelChange}
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name} (v{model.version})
            </option>
          ))}
        </select>
      </div>
      
      {currentModelId && (
        <div className="model-details">
          {models.filter(model => model.id === currentModelId).map(model => (
            <div key={model.id} className="model-info">
              <p className="model-description">{model.description}</p>
              <div className="model-metadata">
                <span>Created: {formatDate(model.created)}</span>
                <span>Updated: {formatDate(model.updated)}</span>
              </div>
              <div className="model-stats">
                <div className="stat-item">
                  <span className="stat-value">{model.technicalAssets.length}</span>
                  <span className="stat-label">Technical Assets</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{model.trustBoundaries.length}</span>
                  <span className="stat-label">Trust Boundaries</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{model.dataFlows.length}</span>
                  <span className="stat-label">Data Flows</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
