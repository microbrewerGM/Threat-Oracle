import React from 'react';
import ModelSelector from '@/components/model/ModelSelector';
import { useModelStore } from '@/store/modelStore';
import './TechnicalAssets.css';

const TechnicalAssets: React.FC = () => {
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();
  const technicalAssets = currentModel?.technicalAssets || [];
  
  return (
    <div className="technical-assets-page">
      <h1>Technical Assets</h1>
      <p className="description">
        Technical assets represent the components of your system such as servers, applications, databases, and more.
      </p>
      
      <ModelSelector />
      
      <div className="assets-list">
        {technicalAssets.length > 0 ? (
          technicalAssets.map(asset => (
          <div key={asset.id} className="asset-card card">
            <div className="asset-header">
              <h2>{asset.name}</h2>
              <span className={`asset-type type-${asset.type}`}>{asset.type}</span>
            </div>
            <p className="asset-description">{asset.description}</p>
            <div className="asset-details">
              <div className="detail-item">
                <span className="detail-label">Owner:</span>
                <span className="detail-value">{asset.owner || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Criticality:</span>
                <span className={`detail-value criticality-${asset.criticality}`}>
                  {asset.criticality || 'Not specified'}
                </span>
              </div>
              {asset.technology_stack && asset.technology_stack.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Technology Stack:</span>
                  <div className="detail-value">
                    {asset.technology_stack.map(tech => (
                      <span key={tech} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              )}
              {asset.tags && asset.tags.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Tags:</span>
                  <div className="detail-value">
                    {asset.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          ))
        ) : (
          <div className="empty-assets">
            <p>No technical assets found in the current model.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalAssets;
