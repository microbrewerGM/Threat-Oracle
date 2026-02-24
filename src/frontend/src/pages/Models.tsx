import React, { useState, useEffect } from 'react';
import { useModelStore, ThreatModel } from '@/store/modelStore';
import './Models.css';

const Models: React.FC = () => {
  const {
    models, currentModelId, loading, error,
    setCurrentModel, addModel,
    fetchModels, createModelAsync, updateModelAsync, deleteModelAsync
  } = useModelStore();
  const [showNewModelForm, setShowNewModelForm] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelDescription, setNewModelDescription] = useState('');
  const [importText, setImportText] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importError, setImportError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingModel, setEditingModel] = useState<ThreatModel | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editRepoUrl, setEditRepoUrl] = useState('');

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleSelectModel = (id: string) => {
    setCurrentModel(id);
  };

  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim()) return;

    createModelAsync({
      name: newModelName,
      description: newModelDescription || undefined,
    });

    setNewModelName('');
    setNewModelDescription('');
    setShowNewModelForm(false);
  };

  const handleDeleteModel = (id: string) => {
    if (window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      deleteModelAsync(id);
    }
  };

  const handleExportModel = (model: ThreatModel) => {
    const modelJson = JSON.stringify(model, null, 2);
    const blob = new Blob([modelJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    const safeName = model.name.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-').slice(0, 100).toLowerCase();
    a.download = `${safeName}-v${model.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportModel = (e: React.FormEvent) => {
    e.preventDefault();
    setImportError('');

    try {
      if (importText.length > 1_048_576) {
        setImportError('Import too large. Maximum size: 1MB');
        return;
      }

      const modelData = JSON.parse(importText);

      // Basic validation
      if (!modelData.name || !modelData.version) {
        setImportError('Invalid model format: missing required fields');
        return;
      }

      // Strict allowlist extraction — prevents prototype pollution
      addModel({
        name: String(modelData.name).slice(0, 255),
        description: String(modelData.description || '').slice(0, 5000),
        version: String(modelData.version).slice(0, 50),
        technicalAssets: Array.isArray(modelData.technicalAssets) ? modelData.technicalAssets : [],
        trustBoundaries: Array.isArray(modelData.trustBoundaries) ? modelData.trustBoundaries : [],
        dataFlows: Array.isArray(modelData.dataFlows) ? modelData.dataFlows : [],
        dataAssets: Array.isArray(modelData.dataAssets) ? modelData.dataAssets : []
      });

      setImportText('');
      setShowImportForm(false);
    } catch {
      setImportError('Invalid JSON format');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleEditModel = (model: ThreatModel) => {
    setEditingModel(model);
    setEditName(model.name);
    setEditDescription(model.description || '');
    setEditVersion(model.version);
    setEditRepoUrl(model.repoUrl || '');
    setShowEditForm(true);
  };

  const handleUpdateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel) return;
    updateModelAsync(editingModel.id, {
      name: editName,
      description: editDescription,
      version: editVersion,
      repo_url: editRepoUrl || undefined,
    });
    setShowEditForm(false);
    setEditingModel(null);
  };

  const dismissError = () => {
    useModelStore.setState({ error: null });
  };

  return (
    <div className="models-page">
      <h1>Threat Models</h1>
      <p className="description">
        Manage your threat models. Create new models, import existing ones, or export models for sharing.
      </p>

      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button className="dismiss-button" onClick={dismissError}>Dismiss</button>
        </div>
      )}

      {loading && <div className="loading-indicator">Loading...</div>}

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
                  maxLength={255}
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
                  maxLength={5000}
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
                  maxLength={1048576}
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

      {showEditForm && editingModel && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Model</h2>
              <button className="close-button" onClick={() => setShowEditForm(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateModel}>
              <div className="form-group">
                <label htmlFor="edit-name">Name:</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={255}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Description:</label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={5000}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-version">Version:</label>
                <input
                  id="edit-version"
                  type="text"
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-repo-url">Repo URL:</label>
                <input
                  id="edit-repo-url"
                  type="url"
                  value={editRepoUrl}
                  onChange={(e) => setEditRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  maxLength={500}
                />
                {editRepoUrl && (() => {
                  try {
                    const protocol = new URL(editRepoUrl).protocol;
                    if (protocol === 'http:' || protocol === 'https:') {
                      return (
                        <div className="repo-url-link">
                          <a href={editRepoUrl} target="_blank" rel="noopener noreferrer">{editRepoUrl}</a>
                        </div>
                      );
                    }
                  } catch { /* invalid URL, don't render link */ }
                  return null;
                })()}
              </div>
              {editingModel.analysisMetadata && (
                <div className="analysis-metadata">
                  <div>Analyzed: {new Date(editingModel.analysisMetadata.analyzedAt).toLocaleDateString()}</div>
                  <div className="languages">
                    {Object.entries(editingModel.analysisMetadata.languages).map(([lang, pct]) => (
                      <span key={lang} className="language-tag">{lang}: {pct}%</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditForm(false)}>Cancel</button>
                <button type="submit">Save</button>
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
                <span className="label">Tech Assets</span>
              </div>
              <div className="asset-count">
                <span className="count">{model.dataAssets.length}</span>
                <span className="label">Data Assets</span>
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
                className="action-button edit-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditModel(model);
                }}
              >
                Edit
              </button>
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
