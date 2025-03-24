import React, { useState } from 'react';
import { useModelStore } from '@/store/modelStore';
import { DataAsset } from '@/store/sampleData';
import ModelSelector from '@/components/model/ModelSelector';
import './DataAssets.css';

const DataAssets: React.FC = () => {
  const { getCurrentModel, addDataAsset, updateDataAsset, deleteDataAsset } = useModelStore();
  const currentModel = getCurrentModel();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<DataAsset | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<DataAsset>>({
    name: '',
    description: '',
    type: 'pii',
    medium: 'digital',
    classification: 'confidential',
    format: '',
    volume: '',
    owner: '',
    retention_period: '',
    regulatory_requirements: [],
    encryption_requirements: 'none',
    integrity_requirements: 'medium',
    availability_requirements: 'medium',
    stored_in: [],
    processed_by: [],
    transmitted_in: [],
    tags: []
  });
  
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'pii',
      medium: 'digital',
      classification: 'confidential',
      format: '',
      volume: '',
      owner: '',
      retention_period: '',
      regulatory_requirements: [],
      encryption_requirements: 'none',
      integrity_requirements: 'medium',
      availability_requirements: 'medium',
      stored_in: [],
      processed_by: [],
      transmitted_in: [],
      tags: []
    });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const value = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      [field]: value.split(',').map(item => item.trim()).filter(item => item !== '')
    }));
  };
  
  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.medium || !formData.classification) return;
    
    addDataAsset(formData as Omit<DataAsset, 'id'>);
    resetForm();
    setShowAddForm(false);
  };
  
  const handleEditAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !formData.name || !formData.type || !formData.medium || !formData.classification) return;
    
    updateDataAsset(selectedAsset.id, formData);
    resetForm();
    setSelectedAsset(null);
    setShowEditForm(false);
  };
  
  const handleDeleteAsset = (id: string) => {
    if (window.confirm('Are you sure you want to delete this data asset? This action cannot be undone.')) {
      deleteDataAsset(id);
    }
  };
  
  const openEditForm = (asset: DataAsset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description || '',
      type: asset.type,
      medium: asset.medium,
      classification: asset.classification,
      format: asset.format || '',
      volume: asset.volume || '',
      owner: asset.owner || '',
      retention_period: asset.retention_period || '',
      regulatory_requirements: asset.regulatory_requirements || [],
      encryption_requirements: asset.encryption_requirements || 'none',
      integrity_requirements: asset.integrity_requirements || 'medium',
      availability_requirements: asset.availability_requirements || 'medium',
      stored_in: asset.stored_in || [],
      processed_by: asset.processed_by || [],
      transmitted_in: asset.transmitted_in || [],
      tags: asset.tags || []
    });
    setShowEditForm(true);
  };
  
  const getClassificationBadgeClass = (classification: string) => {
    switch (classification) {
      case 'public': return 'badge-info';
      case 'internal': return 'badge-secondary';
      case 'confidential': return 'badge-warning';
      case 'restricted': return 'badge-danger';
      case 'secret': return 'badge-danger';
      case 'top_secret': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };
  
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'pii': return 'badge-danger';
      case 'pfi': return 'badge-danger';
      case 'phi': return 'badge-danger';
      case 'intellectual_property': return 'badge-warning';
      case 'authentication_data': return 'badge-warning';
      case 'configuration': return 'badge-info';
      case 'logs': return 'badge-info';
      case 'business_data': return 'badge-primary';
      case 'operational_data': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };
  
  const formatArrayForDisplay = (arr?: string[]) => {
    if (!arr || arr.length === 0) return '-';
    return arr.join(', ');
  };
  
  const renderForm = (isEdit: boolean) => {
    const title = isEdit ? 'Edit Data Asset' : 'Add Data Asset';
    const submitHandler = isEdit ? handleEditAsset : handleAddAsset;
    const closeHandler = isEdit 
      ? () => { setShowEditForm(false); setSelectedAsset(null); resetForm(); }
      : () => { setShowAddForm(false); resetForm(); };
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2>{title}</h2>
            <button className="close-button" onClick={closeHandler}>×</button>
          </div>
          <form onSubmit={submitHandler}>
            <div className="form-group">
              <label htmlFor="name">Name:</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter data asset name"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description:</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type:</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="pii">PII (Personal Identifiable Information)</option>
                  <option value="pfi">PFI (Personal Financial Information)</option>
                  <option value="phi">PHI (Personal Health Information)</option>
                  <option value="intellectual_property">Intellectual Property</option>
                  <option value="authentication_data">Authentication Data</option>
                  <option value="configuration">Configuration</option>
                  <option value="logs">Logs</option>
                  <option value="business_data">Business Data</option>
                  <option value="operational_data">Operational Data</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="medium">Medium:</label>
                <select
                  id="medium"
                  name="medium"
                  value={formData.medium}
                  onChange={handleInputChange}
                  required
                >
                  <option value="digital">Digital</option>
                  <option value="physical">Physical</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="classification">Classification:</label>
                <select
                  id="classification"
                  name="classification"
                  value={formData.classification}
                  onChange={handleInputChange}
                  required
                >
                  <option value="public">Public</option>
                  <option value="internal">Internal</option>
                  <option value="confidential">Confidential</option>
                  <option value="restricted">Restricted</option>
                  <option value="secret">Secret</option>
                  <option value="top_secret">Top Secret</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="format">Format:</label>
                <input
                  id="format"
                  name="format"
                  type="text"
                  value={formData.format}
                  onChange={handleInputChange}
                  placeholder="e.g., JSON, XML, PDF"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="volume">Volume:</label>
                <input
                  id="volume"
                  name="volume"
                  type="text"
                  value={formData.volume}
                  onChange={handleInputChange}
                  placeholder="e.g., 10GB, 1000 records"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="owner">Owner:</label>
                <input
                  id="owner"
                  name="owner"
                  type="text"
                  value={formData.owner}
                  onChange={handleInputChange}
                  placeholder="Enter owner or responsible party"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="retention_period">Retention Period:</label>
                <input
                  id="retention_period"
                  name="retention_period"
                  type="text"
                  value={formData.retention_period}
                  onChange={handleInputChange}
                  placeholder="e.g., 7 years, indefinite"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="regulatory_requirements">Regulatory Requirements:</label>
              <input
                id="regulatory_requirements"
                name="regulatory_requirements"
                type="text"
                value={formData.regulatory_requirements?.join(', ')}
                onChange={(e) => handleArrayInputChange(e, 'regulatory_requirements')}
                placeholder="e.g., GDPR, HIPAA, PCI-DSS (comma separated)"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="encryption_requirements">Encryption Requirements:</label>
                <select
                  id="encryption_requirements"
                  name="encryption_requirements"
                  value={formData.encryption_requirements}
                  onChange={handleInputChange}
                >
                  <option value="none">None</option>
                  <option value="in_transit">In Transit</option>
                  <option value="at_rest">At Rest</option>
                  <option value="both">Both (Transit & Rest)</option>
                  <option value="end_to_end">End-to-End</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="integrity_requirements">Integrity Requirements:</label>
                <select
                  id="integrity_requirements"
                  name="integrity_requirements"
                  value={formData.integrity_requirements}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="availability_requirements">Availability Requirements:</label>
                <select
                  id="availability_requirements"
                  name="availability_requirements"
                  value={formData.availability_requirements}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="stored_in">Stored In (Technical Asset IDs):</label>
              <input
                id="stored_in"
                name="stored_in"
                type="text"
                value={formData.stored_in?.join(', ')}
                onChange={(e) => handleArrayInputChange(e, 'stored_in')}
                placeholder="e.g., ta-001, ta-003 (comma separated)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="processed_by">Processed By (Technical Asset IDs):</label>
              <input
                id="processed_by"
                name="processed_by"
                type="text"
                value={formData.processed_by?.join(', ')}
                onChange={(e) => handleArrayInputChange(e, 'processed_by')}
                placeholder="e.g., ta-002, ta-004 (comma separated)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="transmitted_in">Transmitted In (Data Flow IDs):</label>
              <input
                id="transmitted_in"
                name="transmitted_in"
                type="text"
                value={formData.transmitted_in?.join(', ')}
                onChange={(e) => handleArrayInputChange(e, 'transmitted_in')}
                placeholder="e.g., df-001, df-002 (comma separated)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="tags">Tags:</label>
              <input
                id="tags"
                name="tags"
                type="text"
                value={formData.tags?.join(', ')}
                onChange={(e) => handleArrayInputChange(e, 'tags')}
                placeholder="e.g., customer, financial, sensitive (comma separated)"
              />
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={closeHandler}>Cancel</button>
              <button type="submit">{isEdit ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  return (
    <div className="data-assets-page">
      <h1>Data Assets</h1>
      <p className="description">
        Data assets represent the information that flows through your system, such as personal data, financial records, and configuration data.
      </p>
      
      <div className="page-actions">
        <ModelSelector />
        <button 
          className="action-button add-button" 
          onClick={() => setShowAddForm(true)}
          disabled={!currentModel}
        >
          Add Data Asset
        </button>
      </div>
      
      {currentModel && currentModel.dataAssets.length > 0 ? (
        <div className="data-assets-list">
          <div className="data-assets-list-header">
            <div className="asset-name-col">Name</div>
            <div className="asset-type-col">Type</div>
            <div className="asset-medium-col">Medium</div>
            <div className="asset-classification-col">Classification</div>
            <div className="asset-actions-col">Actions</div>
          </div>
          
          {currentModel.dataAssets.map(asset => (
            <div key={asset.id} className="data-asset-item">
              <div className="asset-name-col">
                <div className="asset-name">{asset.name}</div>
                {asset.description && <div className="asset-description">{asset.description}</div>}
              </div>
              <div className="asset-type-col">
                <span className={`badge ${getTypeBadgeClass(asset.type)}`}>
                  {asset.type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="asset-medium-col">
                <span className="badge badge-secondary">
                  {asset.medium}
                </span>
              </div>
              <div className="asset-classification-col">
                <span className={`badge ${getClassificationBadgeClass(asset.classification)}`}>
                  {asset.classification}
                </span>
              </div>
              <div className="asset-actions-col">
                <button 
                  className="action-button view-button"
                  onClick={() => openEditForm(asset)}
                >
                  View/Edit
                </button>
                <button 
                  className="action-button delete-button"
                  onClick={() => handleDeleteAsset(asset.id)}
                >
                  Delete
                </button>
              </div>
              
              <div className="asset-details">
                <div className="detail-row">
                  <div className="detail-label">Format:</div>
                  <div className="detail-value">{asset.format || '-'}</div>
                  
                  <div className="detail-label">Volume:</div>
                  <div className="detail-value">{asset.volume || '-'}</div>
                  
                  <div className="detail-label">Owner:</div>
                  <div className="detail-value">{asset.owner || '-'}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Retention:</div>
                  <div className="detail-value">{asset.retention_period || '-'}</div>
                  
                  <div className="detail-label">Encryption:</div>
                  <div className="detail-value">{asset.encryption_requirements?.replace(/_/g, ' ') || '-'}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Integrity:</div>
                  <div className="detail-value">{asset.integrity_requirements || '-'}</div>
                  
                  <div className="detail-label">Availability:</div>
                  <div className="detail-value">{asset.availability_requirements || '-'}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Regulatory:</div>
                  <div className="detail-value">{formatArrayForDisplay(asset.regulatory_requirements)}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Stored In:</div>
                  <div className="detail-value">{formatArrayForDisplay(asset.stored_in)}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Processed By:</div>
                  <div className="detail-value">{formatArrayForDisplay(asset.processed_by)}</div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-label">Transmitted In:</div>
                  <div className="detail-value">{formatArrayForDisplay(asset.transmitted_in)}</div>
                </div>
                
                {asset.tags && asset.tags.length > 0 && (
                  <div className="detail-row">
                    <div className="detail-label">Tags:</div>
                    <div className="detail-value tags">
                      {asset.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No Data Assets</h2>
          <p>
            {currentModel 
              ? 'This model does not have any data assets yet. Click "Add Data Asset" to create one.'
              : 'Please select a model to view or add data assets.'}
          </p>
        </div>
      )}
      
      {showAddForm && renderForm(false)}
      {showEditForm && selectedAsset && renderForm(true)}
    </div>
  );
};

export default DataAssets;
