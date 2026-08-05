import { create } from 'zustand';
import {
  technicalAssets as initialTechnicalAssets,
  trustBoundaries as initialTrustBoundaries,
  dataFlows as initialDataFlows,
  dataAssets as initialDataAssets,
  TechnicalAsset,
  TrustBoundary,
  DataFlow,
  DataAsset
} from './sampleData';
import { threatOracleAPI, ModelNode, ModelDetailResponse } from '@/services/api';

export interface ThreatModel {
  id: string;
  name: string;
  description?: string;
  repoUrl?: string;
  analysisMetadata?: { analyzedAt: string; languages: Record<string, number> };
  version: string;
  created: string;
  updated: string;
  technicalAssets: TechnicalAsset[];
  trustBoundaries: TrustBoundary[];
  dataFlows: DataFlow[];
  dataAssets: DataAsset[];
}

function mapBackendModel(node: ModelNode): ThreatModel {
  return {
    id: node.model_id,
    name: node.name,
    description: node.description || undefined,
    repoUrl: node.repo_url || undefined,
    version: node.version,
    created: node.created,
    updated: node.updated,
    technicalAssets: [],
    trustBoundaries: [],
    dataFlows: [],
    dataAssets: [],
  };
}

function mapBackendModelDetail(resp: ModelDetailResponse): ThreatModel {
  return {
    id: resp.model.model_id,
    name: resp.model.name,
    description: resp.model.description || undefined,
    repoUrl: resp.model.repo_url || undefined,
    version: resp.model.version,
    created: resp.model.created,
    updated: resp.model.updated,
    technicalAssets: resp.technical_assets as unknown as TechnicalAsset[],
    trustBoundaries: resp.trust_boundaries as unknown as TrustBoundary[],
    dataFlows: resp.data_flows as unknown as DataFlow[],
    dataAssets: resp.data_assets as unknown as DataAsset[],
  };
}

interface ModelState {
  models: ThreatModel[];
  currentModelId: string | null;
  loading: boolean;
  error: string | null;
  getCurrentModel: () => ThreatModel | null;
  addModel: (model: Omit<ThreatModel, 'id' | 'created' | 'updated'>) => void;
  updateModel: (id: string, updates: Partial<ThreatModel>) => void;
  deleteModel: (id: string) => void;
  setCurrentModel: (id: string) => void;
  fetchModels: () => Promise<void>;
  fetchModel: (id: string) => Promise<void>;
  createModelAsync: (data: { name: string; description?: string; version?: string; repo_url?: string }) => Promise<void>;
  updateModelAsync: (id: string, data: { name?: string; description?: string; version?: string; repo_url?: string }) => Promise<void>;
  deleteModelAsync: (id: string) => Promise<void>;

  // Technical Assets
  addTechnicalAsset: (asset: Omit<TechnicalAsset, 'id'>) => void;
  updateTechnicalAsset: (id: string, updates: Partial<TechnicalAsset>) => void;
  deleteTechnicalAsset: (id: string) => void;

  // Trust Boundaries
  addTrustBoundary: (boundary: Omit<TrustBoundary, 'id'>) => void;
  updateTrustBoundary: (id: string, updates: Partial<TrustBoundary>) => void;
  deleteTrustBoundary: (id: string) => void;

  // Data Flows
  addDataFlow: (flow: Omit<DataFlow, 'id'>) => void;
  updateDataFlow: (id: string, updates: Partial<DataFlow>) => void;
  deleteDataFlow: (id: string) => void;

  // Data Assets
  addDataAsset: (asset: Omit<DataAsset, 'id'>) => void;
  updateDataAsset: (id: string, updates: Partial<DataAsset>) => void;
  deleteDataAsset: (id: string) => void;
}

// Create a default model with sample data
const defaultModel: ThreatModel = {
  id: 'model-001',
  name: 'Sample Threat Model',
  description: 'A sample threat model for demonstration purposes',
  version: '0.1.0',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  technicalAssets: initialTechnicalAssets,
  trustBoundaries: initialTrustBoundaries,
  dataFlows: initialDataFlows,
  dataAssets: initialDataAssets
};

// Create the store
export const useModelStore = create<ModelState>((set, get) => ({
  models: [defaultModel],
  currentModelId: defaultModel.id,
  loading: false,
  error: null,

  getCurrentModel: () => {
    const { models, currentModelId } = get();
    if (!currentModelId) return null;
    return models.find(model => model.id === currentModelId) || null;
  },

  addModel: (model) => {
    const newModel: ThreatModel = {
      ...model,
      id: crypto.randomUUID(),
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };

    set(state => ({
      models: [...state.models, newModel],
      currentModelId: newModel.id
    }));
  },

  updateModel: (id, updates) => {
    const { id: _id, created: _created, ...safeUpdates } = updates;
    set(state => ({
      models: state.models.map(model =>
        model.id === id
          ? { ...model, ...safeUpdates, updated: new Date().toISOString() }
          : model
      )
    }));
  },

  deleteModel: (id) => {
    set(state => {
      const newModels = state.models.filter(model => model.id !== id);
      return {
        models: newModels,
        currentModelId: state.currentModelId === id
          ? (newModels.length > 0 ? newModels[0].id : null)
          : state.currentModelId
      };
    });
  },

  setCurrentModel: (id) => {
    set({ currentModelId: id });
  },

  // Async API actions
  fetchModels: async () => {
    set({ loading: true, error: null });
    try {
      const resp = await threatOracleAPI.listModels();
      const models = resp.models.map(mapBackendModel);
      if (models.length > 0) {
        set({ models, currentModelId: models[0].id, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to fetch models' });
    }
  },

  fetchModel: async (id) => {
    set({ loading: true, error: null });
    try {
      const resp = await threatOracleAPI.getModel(id);
      const model = mapBackendModelDetail(resp);
      set(state => ({
        models: state.models.map(m => m.id === id ? model : m),
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to fetch model:', err);
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to fetch model' });
    }
  },

  createModelAsync: async (data) => {
    set({ loading: true, error: null });
    try {
      const node = await threatOracleAPI.createModel(data);
      const model = mapBackendModel(node);
      set(state => ({
        models: [...state.models, model],
        currentModelId: model.id,
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to create model via API, falling back to local:', err);
      get().addModel({
        name: data.name,
        description: data.description,
        repoUrl: data.repo_url,
        version: data.version || '0.1.0',
        technicalAssets: [],
        trustBoundaries: [],
        dataFlows: [],
        dataAssets: [],
      });
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to create model' });
    }
  },

  updateModelAsync: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const node = await threatOracleAPI.updateModel(id, data);
      const model = mapBackendModel(node);
      set(state => ({
        models: state.models.map(m => m.id === id ? { ...m, ...model } : m),
        loading: false,
      }));
    } catch (err) {
      console.error('Failed to update model via API, falling back to local:', err);
      get().updateModel(id, {
        name: data.name,
        description: data.description,
        version: data.version,
        repoUrl: data.repo_url,
      });
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to update model' });
    }
  },

  deleteModelAsync: async (id) => {
    set({ loading: true, error: null });
    try {
      await threatOracleAPI.deleteModel(id);
      get().deleteModel(id);
      set({ loading: false });
    } catch (err) {
      console.error('Failed to delete model via API, falling back to local:', err);
      get().deleteModel(id);
      set({ loading: false, error: err instanceof Error ? err.message : 'Failed to delete model' });
    }
  },

  // Technical Assets
  addTechnicalAsset: (asset) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    const newAsset: TechnicalAsset = {
      ...asset,
      id: crypto.randomUUID()
    };

    updateModel(currentModel.id, {
      technicalAssets: [...currentModel.technicalAssets, newAsset],
      updated: new Date().toISOString()
    });
  },

  updateTechnicalAsset: (id, updates) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      technicalAssets: currentModel.technicalAssets.map(asset =>
        asset.id === id ? { ...asset, ...updates } : asset
      ),
      updated: new Date().toISOString()
    });
  },

  deleteTechnicalAsset: (id) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      technicalAssets: currentModel.technicalAssets.filter(asset => asset.id !== id),
      updated: new Date().toISOString()
    });
  },

  // Trust Boundaries
  addTrustBoundary: (boundary) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    const newBoundary: TrustBoundary = {
      ...boundary,
      id: crypto.randomUUID()
    };

    updateModel(currentModel.id, {
      trustBoundaries: [...currentModel.trustBoundaries, newBoundary],
      updated: new Date().toISOString()
    });
  },

  updateTrustBoundary: (id, updates) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      trustBoundaries: currentModel.trustBoundaries.map(boundary =>
        boundary.id === id ? { ...boundary, ...updates } : boundary
      ),
      updated: new Date().toISOString()
    });
  },

  deleteTrustBoundary: (id) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      trustBoundaries: currentModel.trustBoundaries.filter(boundary => boundary.id !== id),
      updated: new Date().toISOString()
    });
  },

  // Data Flows
  addDataFlow: (flow) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    const newFlow: DataFlow = {
      ...flow,
      id: crypto.randomUUID()
    };

    updateModel(currentModel.id, {
      dataFlows: [...currentModel.dataFlows, newFlow],
      updated: new Date().toISOString()
    });
  },

  updateDataFlow: (id, updates) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      dataFlows: currentModel.dataFlows.map(flow =>
        flow.id === id ? { ...flow, ...updates } : flow
      ),
      updated: new Date().toISOString()
    });
  },

  deleteDataFlow: (id) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      dataFlows: currentModel.dataFlows.filter(flow => flow.id !== id),
      updated: new Date().toISOString()
    });
  },

  // Data Assets
  addDataAsset: (asset) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    const newAsset: DataAsset = {
      ...asset,
      id: crypto.randomUUID()
    };

    updateModel(currentModel.id, {
      dataAssets: [...currentModel.dataAssets, newAsset],
      updated: new Date().toISOString()
    });
  },

  updateDataAsset: (id, updates) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      dataAssets: currentModel.dataAssets.map(asset =>
        asset.id === id ? { ...asset, ...updates } : asset
      ),
      updated: new Date().toISOString()
    });
  },

  deleteDataAsset: (id) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;

    updateModel(currentModel.id, {
      dataAssets: currentModel.dataAssets.filter(asset => asset.id !== id),
      updated: new Date().toISOString()
    });
  }
}));
