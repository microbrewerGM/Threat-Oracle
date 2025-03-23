import React from 'react';
import ModelSelector from '@/components/model/ModelSelector';
import { useModelStore } from '@/store/modelStore';
import './DataFlows.css';

const DataFlows: React.FC = () => {
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();
  const dataFlows = currentModel?.dataFlows || [];
  
  // Helper function to get asset name by ID
  const getAssetName = (id: string) => {
    if (!currentModel) return 'Unknown Asset';
    const asset = currentModel.technicalAssets.find(asset => asset.id === id);
    return asset ? asset.name : 'Unknown Asset';
  };

  return (
    <div className="data-flows-page">
      <h1>Data Flows</h1>
      <p className="description">
        Data flows represent how information moves between technical assets in your system.
      </p>
      
      <ModelSelector />
      
      <div className="flows-list">
        {dataFlows.length > 0 ? (
          dataFlows.map(flow => (
          <div key={flow.id} className="flow-card card">
            <div className="flow-header">
              <h2>{flow.name || `Flow ${flow.id}`}</h2>
              <span className={`flow-protocol protocol-${flow.protocol}`}>{flow.protocol.toUpperCase()}</span>
            </div>
            <p className="flow-description">{flow.description || 'No description provided.'}</p>
            
            <div className="flow-path">
              <div className="flow-endpoint source">
                <span className="endpoint-label">Source:</span>
                <span className="endpoint-value">{getAssetName(flow.source_id)}</span>
              </div>
              <div className="flow-arrow">→</div>
              <div className="flow-endpoint target">
                <span className="endpoint-label">Target:</span>
                <span className="endpoint-value">{getAssetName(flow.target_id)}</span>
              </div>
            </div>
            
            <div className="flow-details">
              {flow.port && (
                <div className="detail-item">
                  <span className="detail-label">Port:</span>
                  <span className="detail-value">{flow.port}</span>
                </div>
              )}
              
              <div className="detail-item">
                <span className="detail-label">Encryption:</span>
                <span className={`detail-value ${flow.is_encrypted ? 'encrypted' : 'not-encrypted'}`}>
                  {flow.is_encrypted ? 'Encrypted' : 'Not Encrypted'}
                </span>
              </div>
              
              {flow.authentication_method && (
                <div className="detail-item">
                  <span className="detail-label">Authentication:</span>
                  <span className="detail-value">{flow.authentication_method}</span>
                </div>
              )}
              
              <div className="detail-item">
                <span className="detail-label">Crosses Trust Boundary:</span>
                <span className={`detail-value ${flow.crosses_trust_boundary ? 'crosses-boundary' : ''}`}>
                  {flow.crosses_trust_boundary ? 'Yes' : 'No'}
                </span>
              </div>
              
              {flow.tags && flow.tags.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Tags:</span>
                  <div className="detail-value">
                    {flow.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          ))
        ) : (
          <div className="empty-flows">
            <p>No data flows found in the current model.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataFlows;
