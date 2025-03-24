import React from 'react';
import './AssetDetailPopup.css'; // Reuse the same CSS
import { useModelStore } from '@/store/modelStore';

interface EdgeDetailPopupProps {
  edgeId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onDrillDown: () => void;
}

const EdgeDetailPopup: React.FC<EdgeDetailPopupProps> = ({
  edgeId,
  position,
  onClose,
  onDrillDown,
}) => {
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();

  // Find the edge based on the id
  const edge = React.useMemo(() => {
    if (!currentModel) return null;
    return currentModel.dataFlows.find((e) => e.id === edgeId);
  }, [currentModel, edgeId]);

  if (!edge) return null;

  // Find source and target assets
  const sourceAsset = currentModel?.technicalAssets.find(
    (a) => a.id === edge.source_id
  );
  
  const targetAsset = currentModel?.technicalAssets.find(
    (a) => a.id === edge.target_id
  );

  // Calculate position to ensure popup stays within viewport
  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  return (
    <div className="asset-detail-popup" style={style}>
      <div className="popup-header">
        <h3>{edge.name || `${edge.protocol.toUpperCase()} Flow`}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="popup-content">
        <div className="popup-section">
          <h4>Basic Information</h4>
          <div className="info-row">
            <span className="info-label">ID:</span>
            <span className="info-value">{edge.id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Protocol:</span>
            <span className="info-value">{edge.protocol.toUpperCase()}</span>
          </div>
          {edge.description && (
            <div className="info-row">
              <span className="info-label">Description:</span>
              <span className="info-value">{edge.description}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Direction:</span>
            <span className="info-value">
              {sourceAsset?.name || 'Unknown'} → {targetAsset?.name || 'Unknown'}
            </span>
          </div>
        </div>
        
        <div className="popup-section">
          <h4>Connection Details</h4>
          {edge.port && (
            <div className="info-row">
              <span className="info-label">Port:</span>
              <span className="info-value">{edge.port}</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Encrypted:</span>
            <span className="info-value">{edge.is_encrypted ? 'Yes' : 'No'}</span>
          </div>
          {edge.authentication_method && (
            <div className="info-row">
              <span className="info-label">Auth Method:</span>
              <span className="info-value">{edge.authentication_method.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
        
        <div className="popup-section">
          <h4>Security Information</h4>
          <div className="info-row">
            <span className="info-label">Crosses Boundary:</span>
            <span className="info-value">{edge.crosses_trust_boundary ? 'Yes' : 'No'}</span>
          </div>
          {edge.trust_boundary_id && (
            <div className="info-row">
              <span className="info-label">Boundary:</span>
              <span className="info-value">
                {currentModel?.trustBoundaries.find(tb => tb.id === edge.trust_boundary_id)?.name || edge.trust_boundary_id}
              </span>
            </div>
          )}
        </div>
        
        <div className="popup-section">
          <h4>Connected Assets</h4>
          <div className="info-row">
            <span className="info-label">Source:</span>
            <span className="info-value">
              {sourceAsset ? (
                <>
                  {sourceAsset.name} ({sourceAsset.type.replace(/_/g, ' ')})
                </>
              ) : (
                'Unknown'
              )}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Target:</span>
            <span className="info-value">
              {targetAsset ? (
                <>
                  {targetAsset.name} ({targetAsset.type.replace(/_/g, ' ')})
                </>
              ) : (
                'Unknown'
              )}
            </span>
          </div>
        </div>
        
        {edge.tags && edge.tags.length > 0 && (
          <div className="popup-section">
            <h4>Tags</h4>
            <div className="tags-container">
              {edge.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="popup-footer">
        <button className="drilldown-button" onClick={onDrillDown}>
          View Details <span className="chevron">»</span>
        </button>
      </div>
    </div>
  );
};

export default EdgeDetailPopup;
