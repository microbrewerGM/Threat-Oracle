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

export interface ThreatModel {
  id: string;
  name: string;
  description?: string;
  version: string;
  created: string;
  updated: string;
  technicalAssets: TechnicalAsset[];
  trustBoundaries: TrustBoundary[];
  dataFlows: DataFlow[];
  dataAssets: DataAsset[];
}

interface ModelState {
  models: ThreatModel[];
  currentModelId: string | null;
  getCurrentModel: () => ThreatModel | null;
  addModel: (model: Omit<ThreatModel, 'id' | 'created' | 'updated'>) => void;
  updateModel: (id: string, updates: Partial<ThreatModel>) => void;
  deleteModel: (id: string) => void;
  setCurrentModel: (id: string) => void;
  
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
  
  getCurrentModel: () => {
    const { models, currentModelId } = get();
    if (!currentModelId) return null;
    return models.find(model => model.id === currentModelId) || null;
  },
  
  addModel: (model) => {
    const newModel: ThreatModel = {
      ...model,
      id: `model-${Date.now()}`,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    set(state => ({
      models: [...state.models, newModel],
      currentModelId: newModel.id
    }));
  },
  
  updateModel: (id, updates) => {
    set(state => ({
      models: state.models.map(model => 
        model.id === id 
          ? { ...model, ...updates, updated: new Date().toISOString() } 
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
  
  // Technical Assets
  addTechnicalAsset: (asset) => {
    const { getCurrentModel, updateModel } = get();
    const currentModel = getCurrentModel();
    if (!currentModel) return;
    
    const newAsset: TechnicalAsset = {
      ...asset,
      id: `ta-${Date.now()}`
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
      id: `tb-${Date.now()}`
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
      id: `df-${Date.now()}`
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
      id: `da-${Date.now()}`
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
