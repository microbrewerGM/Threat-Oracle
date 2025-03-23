import React from 'react';
import ModelSelector from '@/components/model/ModelSelector';
import { useModelStore } from '@/store/modelStore';
import './TrustBoundaries.css';

const TrustBoundaries: React.FC = () => {
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();
  const trustBoundaries = currentModel?.trustBoundaries || [];
  
  return (
    <div className="trust-boundaries-page">
      <h1>Trust Boundaries</h1>
      <p className="description">
        Trust boundaries define the security zones in your system, such as network segments, security zones, and organizational boundaries.
      </p>
      
      <ModelSelector />
      
      <div className="boundaries-list">
        {trustBoundaries.length > 0 ? (
          trustBoundaries.map(boundary => (
          <div key={boundary.id} className="boundary-card card">
            <div className="boundary-header">
              <h2>{boundary.name}</h2>
              <span className={`boundary-type type-${boundary.type}`}>{boundary.type}</span>
            </div>
            <p className="boundary-description">{boundary.description}</p>
            <div className="boundary-details">
              <div className="detail-item">
                <span className="detail-label">Owner:</span>
                <span className="detail-value">{boundary.owner || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Security Level:</span>
                <span className={`detail-value security-level-${boundary.security_level}`}>
                  {boundary.security_level || 'Not specified'}
                </span>
              </div>
              {boundary.tags && boundary.tags.length > 0 && (
                <div className="detail-item">
                  <span className="detail-label">Tags:</span>
                  <div className="detail-value">
                    {boundary.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          ))
        ) : (
          <div className="empty-boundaries">
            <p>No trust boundaries found in the current model.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrustBoundaries;
