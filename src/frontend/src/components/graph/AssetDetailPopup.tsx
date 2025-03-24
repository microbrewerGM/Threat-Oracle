import React from 'react';
import './AssetDetailPopup.css';
import { useModelStore } from '@/store/modelStore';
import { TechnicalAsset, DataAsset, TrustBoundary } from '@/store/sampleData';

interface AssetDetailPopupProps {
  assetId: string;
  assetType: 'technical' | 'data' | 'trust';
  position: { x: number; y: number };
  onClose: () => void;
  onDrillDown: () => void;
}

const AssetDetailPopup: React.FC<AssetDetailPopupProps> = ({
  assetId,
  assetType,
  position,
  onClose,
  onDrillDown,
}) => {
  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();

  // Type guards for asset types
  const isTechnicalAsset = (asset: any): asset is TechnicalAsset => 
    assetType === 'technical';
  
  const isDataAsset = (asset: any): asset is DataAsset => 
    assetType === 'data';
  
  const isTrustBoundary = (asset: any): asset is TrustBoundary => 
    assetType === 'trust';

  // Find the asset based on the type and id
  const asset = React.useMemo(() => {
    if (!currentModel) return null;

    switch (assetType) {
      case 'technical':
        return currentModel.technicalAssets.find((a) => a.id === assetId);
      case 'data':
        return currentModel.dataAssets.find((a) => a.id === assetId);
      case 'trust':
        return currentModel.trustBoundaries.find((a) => a.id === assetId);
      default:
        return null;
    }
  }, [currentModel, assetId, assetType]);

  if (!asset) return null;

  // Calculate position to ensure popup stays within viewport
  const style = {
    left: `${position.x}px`,
    top: `${position.y}px`,
  };

  // Get related data flows
  const relatedFlows = currentModel?.dataFlows.filter(
    (flow) => flow.source_id === assetId || flow.target_id === assetId
  );

  // Get related data assets (for technical assets)
  const relatedDataAssets = assetType === 'technical' && currentModel
    ? currentModel.dataAssets.filter(
        (da) => 
          da.stored_in?.includes(assetId) || 
          da.processed_by?.includes(assetId)
      )
    : [];

  return (
    <div className="asset-detail-popup" style={style}>
      <div className="popup-header">
        <h3>{asset.name}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="popup-content">
        <div className="popup-section">
          <h4>Basic Information</h4>
          <div className="info-row">
            <span className="info-label">ID:</span>
            <span className="info-value">{asset.id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Type:</span>
            <span className="info-value">{asset.type.replace(/_/g, ' ')}</span>
          </div>
          {asset.description && (
            <div className="info-row">
              <span className="info-label">Description:</span>
              <span className="info-value">{asset.description}</span>
            </div>
          )}
          {asset.owner && (
            <div className="info-row">
              <span className="info-label">Owner:</span>
              <span className="info-value">{asset.owner}</span>
            </div>
          )}
        </div>
        
        {isTechnicalAsset(asset) && (
          <div className="popup-section">
            <h4>Technical Details</h4>
            {asset.criticality && (
              <div className="info-row">
                <span className="info-label">Criticality:</span>
                <span className="info-value">{asset.criticality}</span>
              </div>
            )}
            {asset.technology_stack && asset.technology_stack.length > 0 && (
              <div className="info-row">
                <span className="info-label">Tech Stack:</span>
                <span className="info-value">{asset.technology_stack.join(', ')}</span>
              </div>
            )}
            {asset.version && (
              <div className="info-row">
                <span className="info-label">Version:</span>
                <span className="info-value">{asset.version}</span>
              </div>
            )}
          </div>
        )}
        
        {isDataAsset(asset) && (
          <div className="popup-section">
            <h4>Data Classification</h4>
            <div className="info-row">
              <span className="info-label">Classification:</span>
              <span className="info-value">{asset.classification}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Medium:</span>
              <span className="info-value">{asset.medium}</span>
            </div>
            {asset.encryption_requirements && (
              <div className="info-row">
                <span className="info-label">Encryption:</span>
                <span className="info-value">{asset.encryption_requirements.replace(/_/g, ' ')}</span>
              </div>
            )}
          </div>
        )}
        
        {isTrustBoundary(asset) && (
          <div className="popup-section">
            <h4>Security Information</h4>
            {asset.security_level && (
              <div className="info-row">
                <span className="info-label">Security Level:</span>
                <span className="info-value">{asset.security_level}</span>
              </div>
            )}
          </div>
        )}
        
        {relatedFlows && relatedFlows.length > 0 && (
          <div className="popup-section">
            <h4>Related Data Flows</h4>
            <ul className="related-list">
              {relatedFlows.map(flow => (
                <li key={flow.id}>
                  {flow.name || `${flow.protocol.toUpperCase()} Flow (${flow.id})`}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {relatedDataAssets && relatedDataAssets.length > 0 && (
          <div className="popup-section">
            <h4>Related Data Assets</h4>
            <ul className="related-list">
              {relatedDataAssets.map(da => (
                <li key={da.id}>{da.name}</li>
              ))}
            </ul>
          </div>
        )}
        
        {asset.tags && asset.tags.length > 0 && (
          <div className="popup-section">
            <h4>Tags</h4>
            <div className="tags-container">
              {asset.tags.map(tag => (
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

export default AssetDetailPopup;
