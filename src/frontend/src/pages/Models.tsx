import React, { useState } from 'react';
import { useModelStore, ThreatModel } from '@/store/modelStore';
import './Models.css';

const Models: React.FC = () => {
  const { models, currentModelId, setCurrentModel, addModel, deleteModel } = useModelStore();
  const [showNewModelForm, setShowNewModelForm] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelDescription, setNewModelDescription] = useState('');
  const [importText, setImportText] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importError, setImportError] = useState('');

  const handleSelectModel = (id: string) => {
    setCurrentModel(id);
  };

  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;

    addModel({
      name: newModelName,
      description: newModelDescription,
      version: '0.1.0',
      technicalAssets: [],
      trustBoundaries: [],
      dataFlows: []
    });

    setNewModelName('');
    setNewModelDescription('');
    setShowNewModelForm(false);
  };

  const handleDeleteModel = (id: string) => {
    if (window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      deleteModel(id);
    }
  };

  const handleExportModel = (model: ThreatModel) => {
    const modelJson = JSON.stringify(model, null, 2);
    const blob = new Blob([modelJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.name.replace(/\s+/g, '-').toLowerCase()}-v${model.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportModel = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');
    
    try {
      const modelData = JSON.parse(importText);
      
      // Basic validation
      if (!modelData.name || !modelData.version) {
        setImportError('Invalid model format: missing required fields');
        return;
      }
      
      addModel({
        name: modelData.name,
        description: modelData.description || '',
        version: modelData.version,
        technicalAssets: modelData.technicalAssets || [],
        trustBoundaries: modelData.trustBoundaries || [],
        dataFlows: modelData.dataFlows || []
      });
      
      setImportText('');
      setShowImportForm(false);
    } catch (error) {
      setImportError('Invalid JSON format');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="models-page">
      <h1>Threat Models</h1>
      <p className="description">
        Manage your threat models. Create new models, import existing ones, or export models for sharing.
      </p>
      
      <div className="models-actions">
        <button 
          className="action-button create-button" 
          onClick={() => setShowNewModelForm(true)}
        >
          Create New Model
        </button>
        <button 
          className="action-button import-button" 
          onClick={() => setShowImportForm(true)}
        >
          Import Model
        </button>
      </div>
      
      {showNewModelForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create New Model</h2>
              <button className="close-button" onClick={() => setShowNewModelForm(false)}>×</button>
            </div>
            <form onSubmit={handleCreateModel}>
              <div className="form-group">
                <label htmlFor="model-name">Model Name:</label>
                <input
                  id="model-name"
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Enter model name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="model-description">Description:</label>
                <textarea
                  id="model-description"
                  value={newModelDescription}
                  onChange={(e) => setNewModelDescription(e.target.value)}
                  placeholder="Enter model description"
                  rows={4}
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowNewModelForm(false)}>Cancel</button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {showImportForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Import Model</h2>
              <button className="close-button" onClick={() => setShowImportForm(false)}>×</button>
            </div>
            <form onSubmit={handleImportModel}>
              <div className="form-group">
                <label htmlFor="import-json">Paste JSON:</label>
                <textarea
                  id="import-json"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste model JSON here"
                  rows={10}
                  required
                />
              </div>
              {importError && <div className="error-message">{importError}</div>}
              <div className="form-actions">
                <button type="button" onClick={() => setShowImportForm(false)}>Cancel</button>
                <button type="submit">Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="models-list">
        <div className="models-list-header">
          <div className="model-name-col">Name</div>
          <div className="model-version-col">Version</div>
          <div className="model-date-col">Last Updated</div>
          <div className="model-assets-col">Assets</div>
          <div className="model-actions-col">Actions</div>
        </div>
        
        {models.map(model => (
          <div 
            key={model.id} 
            className={`model-item ${model.id === currentModelId ? 'selected' : ''}`}
            onClick={() => handleSelectModel(model.id)}
          >
            <div className="model-name-col">
              <div className="model-name">{model.name}</div>
              {model.description && <div className="model-description">{model.description}</div>}
            </div>
            <div className="model-version-col">{model.version}</div>
            <div className="model-date-col">{formatDate(model.updated)}</div>
            <div className="model-assets-col">
              <div className="asset-count">
                <span className="count">{model.technicalAssets.length}</span>
                <span className="label">Assets</span>
              </div>
              <div className="asset-count">
                <span className="count">{model.trustBoundaries.length}</span>
                <span className="label">Boundaries</span>
              </div>
              <div className="asset-count">
                <span className="count">{model.dataFlows.length}</span>
                <span className="label">Flows</span>
              </div>
            </div>
            <div className="model-actions-col">
              <button 
                className="action-button export-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExportModel(model);
                }}
              >
                Export
              </button>
              {models.length > 1 && (
                <button 
                  className="action-button delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteModel(model.id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Models;
