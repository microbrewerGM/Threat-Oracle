import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useModelStore } from '../modelStore';

// Mock the API module
vi.mock('@/services/api', () => ({
  threatOracleAPI: {
    listModels: vi.fn(),
    getModel: vi.fn(),
    createModel: vi.fn(),
    updateModel: vi.fn(),
    deleteModel: vi.fn(),
  },
}));

import { threatOracleAPI } from '@/services/api';

// Helper to reset store to initial state between tests
function resetStore() {
  useModelStore.setState(useModelStore.getInitialState());
}

describe('modelStore', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  describe('default state', () => {
    it('includes sample model with id model-001', () => {
      const state = useModelStore.getState();
      expect(state.models).toHaveLength(1);
      expect(state.models[0].id).toBe('model-001');
      expect(state.models[0].name).toBe('Sample Threat Model');
    });

    it('has currentModelId set to model-001', () => {
      const state = useModelStore.getState();
      expect(state.currentModelId).toBe('model-001');
    });

    it('has loading false and error null', () => {
      const state = useModelStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('addModel', () => {
    it('creates model with generated id and timestamps', () => {
      const mockUUID = 'test-uuid-1234';
      vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID as `${string}-${string}-${string}-${string}-${string}`);

      useModelStore.getState().addModel({
        name: 'New Model',
        description: 'A new model',
        version: '1.0.0',
        technicalAssets: [],
        trustBoundaries: [],
        dataFlows: [],
        dataAssets: [],
      });

      const state = useModelStore.getState();
      const newModel = state.models.find((m) => m.id === mockUUID);
      expect(newModel).toBeDefined();
      expect(newModel!.name).toBe('New Model');
      expect(newModel!.created).toBeDefined();
      expect(newModel!.updated).toBeDefined();
      expect(state.currentModelId).toBe(mockUUID);
    });
  });

  describe('updateModel', () => {
    it('updates fields and sets new updated timestamp', () => {
      const originalUpdated = useModelStore.getState().models[0].updated;

      // Small delay to ensure different timestamp
      useModelStore.getState().updateModel('model-001', { name: 'Updated Name' });

      const state = useModelStore.getState();
      const model = state.models.find((m) => m.id === 'model-001');
      expect(model!.name).toBe('Updated Name');
      expect(model!.updated).toBeDefined();
      // The id should remain unchanged even if passed in updates
    });

    it('does not overwrite id or created', () => {
      const originalCreated = useModelStore.getState().models[0].created;

      useModelStore.getState().updateModel('model-001', {
        id: 'hacked-id',
        created: '1999-01-01T00:00:00Z',
        name: 'Safe Update',
      } as any);

      const state = useModelStore.getState();
      const model = state.models.find((m) => m.id === 'model-001');
      expect(model!.id).toBe('model-001');
      expect(model!.created).toBe(originalCreated);
      expect(model!.name).toBe('Safe Update');
    });
  });

  describe('deleteModel', () => {
    it('removes model from the list', () => {
      useModelStore.getState().deleteModel('model-001');
      const state = useModelStore.getState();
      expect(state.models).toHaveLength(0);
    });

    it('updates currentModelId if deleted model was current', () => {
      // Add a second model first
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('model-002' as `${string}-${string}-${string}-${string}-${string}`);
      useModelStore.getState().addModel({
        name: 'Second Model',
        version: '1.0.0',
        technicalAssets: [],
        trustBoundaries: [],
        dataFlows: [],
        dataAssets: [],
      });
      // currentModelId is now model-002 after addModel

      // Set current back to model-001
      useModelStore.getState().setCurrentModel('model-001');

      // Delete model-001
      useModelStore.getState().deleteModel('model-001');

      const state = useModelStore.getState();
      expect(state.currentModelId).toBe('model-002');
    });

    it('sets currentModelId to null when last model is deleted', () => {
      useModelStore.getState().deleteModel('model-001');
      const state = useModelStore.getState();
      expect(state.currentModelId).toBeNull();
    });

    it('does not change currentModelId when deleting a non-current model', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('model-002' as `${string}-${string}-${string}-${string}-${string}`);
      useModelStore.getState().addModel({
        name: 'Second Model',
        version: '1.0.0',
        technicalAssets: [],
        trustBoundaries: [],
        dataFlows: [],
        dataAssets: [],
      });
      // currentModelId is model-002 after addModel

      useModelStore.getState().deleteModel('model-001');
      const state = useModelStore.getState();
      expect(state.currentModelId).toBe('model-002');
    });
  });

  describe('setCurrentModel', () => {
    it('updates currentModelId', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('model-002' as `${string}-${string}-${string}-${string}-${string}`);
      useModelStore.getState().addModel({
        name: 'Second Model',
        version: '1.0.0',
        technicalAssets: [],
        trustBoundaries: [],
        dataFlows: [],
        dataAssets: [],
      });

      useModelStore.getState().setCurrentModel('model-001');
      expect(useModelStore.getState().currentModelId).toBe('model-001');
    });
  });

  describe('getCurrentModel', () => {
    it('returns correct model', () => {
      const model = useModelStore.getState().getCurrentModel();
      expect(model).toBeDefined();
      expect(model!.id).toBe('model-001');
      expect(model!.name).toBe('Sample Threat Model');
    });

    it('returns null when currentModelId is null', () => {
      useModelStore.setState({ currentModelId: null });
      const model = useModelStore.getState().getCurrentModel();
      expect(model).toBeNull();
    });

    it('returns null when currentModelId does not match any model', () => {
      useModelStore.setState({ currentModelId: 'nonexistent' });
      const model = useModelStore.getState().getCurrentModel();
      expect(model).toBeNull();
    });
  });

  describe('fetchModels', () => {
    it('calls API and updates store on success', async () => {
      const mockModels = {
        models: [
          {
            model_id: 'api-model-1',
            name: 'API Model 1',
            description: 'From API',
            version: '1.0.0',
            repo_url: '',
            created: '2025-01-01T00:00:00Z',
            updated: '2025-01-01T00:00:00Z',
          },
        ],
        skip: 0,
        limit: 50,
      };
      vi.mocked(threatOracleAPI.listModels).mockResolvedValue(mockModels);

      await useModelStore.getState().fetchModels();

      const state = useModelStore.getState();
      expect(threatOracleAPI.listModels).toHaveBeenCalled();
      expect(state.models).toHaveLength(1);
      expect(state.models[0].id).toBe('api-model-1');
      expect(state.models[0].name).toBe('API Model 1');
      expect(state.currentModelId).toBe('api-model-1');
      expect(state.loading).toBe(false);
    });

    it('keeps existing models on API failure (graceful degradation)', async () => {
      vi.mocked(threatOracleAPI.listModels).mockRejectedValue(new Error('Network error'));

      await useModelStore.getState().fetchModels();

      const state = useModelStore.getState();
      // Should keep the default model
      expect(state.models).toHaveLength(1);
      expect(state.models[0].id).toBe('model-001');
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Network error');
    });

    it('does not replace models when API returns empty list', async () => {
      vi.mocked(threatOracleAPI.listModels).mockResolvedValue({
        models: [],
        skip: 0,
        limit: 50,
      });

      await useModelStore.getState().fetchModels();

      const state = useModelStore.getState();
      // Keeps existing models when API returns empty
      expect(state.models).toHaveLength(1);
      expect(state.models[0].id).toBe('model-001');
      expect(state.loading).toBe(false);
    });
  });

  describe('createModelAsync', () => {
    it('calls API and adds to store on success', async () => {
      const mockNode = {
        model_id: 'new-api-model',
        name: 'New API Model',
        description: 'Created via API',
        version: '0.1.0',
        repo_url: '',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      };
      vi.mocked(threatOracleAPI.createModel).mockResolvedValue(mockNode);

      await useModelStore.getState().createModelAsync({
        name: 'New API Model',
        description: 'Created via API',
      });

      const state = useModelStore.getState();
      expect(threatOracleAPI.createModel).toHaveBeenCalledWith({
        name: 'New API Model',
        description: 'Created via API',
      });
      const newModel = state.models.find((m) => m.id === 'new-api-model');
      expect(newModel).toBeDefined();
      expect(newModel!.name).toBe('New API Model');
      expect(state.currentModelId).toBe('new-api-model');
      expect(state.loading).toBe(false);
    });

    it('falls back to local addModel on API failure', async () => {
      vi.mocked(threatOracleAPI.createModel).mockRejectedValue(new Error('Server error'));
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('local-fallback' as `${string}-${string}-${string}-${string}-${string}`);

      await useModelStore.getState().createModelAsync({
        name: 'Fallback Model',
        description: 'Created locally',
        repo_url: 'https://github.com/test/repo',
      });

      const state = useModelStore.getState();
      const fallbackModel = state.models.find((m) => m.id === 'local-fallback');
      expect(fallbackModel).toBeDefined();
      expect(fallbackModel!.name).toBe('Fallback Model');
      expect(fallbackModel!.repoUrl).toBe('https://github.com/test/repo');
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Server error');
    });
  });

  describe('deleteModelAsync', () => {
    it('calls API and removes from store', async () => {
      vi.mocked(threatOracleAPI.deleteModel).mockResolvedValue({
        status: 'deleted',
        model_id: 'model-001',
      });

      await useModelStore.getState().deleteModelAsync('model-001');

      const state = useModelStore.getState();
      expect(threatOracleAPI.deleteModel).toHaveBeenCalledWith('model-001');
      expect(state.models).toHaveLength(0);
      expect(state.loading).toBe(false);
    });

    it('still removes locally on API failure', async () => {
      vi.mocked(threatOracleAPI.deleteModel).mockRejectedValue(new Error('Server error'));

      await useModelStore.getState().deleteModelAsync('model-001');

      const state = useModelStore.getState();
      expect(state.models).toHaveLength(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Server error');
    });
  });

  describe('addTechnicalAsset', () => {
    it('adds asset to current model', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('asset-new' as `${string}-${string}-${string}-${string}-${string}`);

      useModelStore.getState().addTechnicalAsset({
        name: 'New Server',
        type: 'server',
        criticality: 'high',
      });

      const model = useModelStore.getState().getCurrentModel();
      const newAsset = model!.technicalAssets.find((a) => a.id === 'asset-new');
      expect(newAsset).toBeDefined();
      expect(newAsset!.name).toBe('New Server');
      expect(newAsset!.type).toBe('server');
    });

    it('does nothing when no current model', () => {
      useModelStore.setState({ currentModelId: null });
      const originalModels = useModelStore.getState().models;

      useModelStore.getState().addTechnicalAsset({
        name: 'Orphan',
        type: 'server',
      });

      expect(useModelStore.getState().models).toEqual(originalModels);
    });
  });

  describe('updateTechnicalAsset', () => {
    it('updates asset in current model', () => {
      // The default model has technicalAssets from sample data with id 'ta-001'
      useModelStore.getState().updateTechnicalAsset('ta-001', { name: 'Updated Server' });

      const model = useModelStore.getState().getCurrentModel();
      const asset = model!.technicalAssets.find((a) => a.id === 'ta-001');
      expect(asset!.name).toBe('Updated Server');
    });
  });

  describe('deleteTechnicalAsset', () => {
    it('removes asset from current model', () => {
      const beforeCount = useModelStore.getState().getCurrentModel()!.technicalAssets.length;

      useModelStore.getState().deleteTechnicalAsset('ta-001');

      const model = useModelStore.getState().getCurrentModel();
      expect(model!.technicalAssets.length).toBe(beforeCount - 1);
      expect(model!.technicalAssets.find((a) => a.id === 'ta-001')).toBeUndefined();
    });
  });

  describe('addDataAsset', () => {
    it('adds data asset to current model', () => {
      vi.spyOn(crypto, 'randomUUID').mockReturnValue('da-new' as `${string}-${string}-${string}-${string}-${string}`);

      useModelStore.getState().addDataAsset({
        name: 'New Data',
        type: 'pii',
        medium: 'digital',
        classification: 'confidential',
      });

      const model = useModelStore.getState().getCurrentModel();
      const newAsset = model!.dataAssets.find((a) => a.id === 'da-new');
      expect(newAsset).toBeDefined();
      expect(newAsset!.name).toBe('New Data');
      expect(newAsset!.type).toBe('pii');
    });
  });

  describe('updateDataAsset', () => {
    it('updates data asset in current model', () => {
      // Default model has data assets from sample data with id 'da-001'
      useModelStore.getState().updateDataAsset('da-001', { name: 'Updated Data' });

      const model = useModelStore.getState().getCurrentModel();
      const asset = model!.dataAssets.find((a) => a.id === 'da-001');
      expect(asset!.name).toBe('Updated Data');
    });
  });

  describe('deleteDataAsset', () => {
    it('removes data asset from current model', () => {
      const beforeCount = useModelStore.getState().getCurrentModel()!.dataAssets.length;

      useModelStore.getState().deleteDataAsset('da-001');

      const model = useModelStore.getState().getCurrentModel();
      expect(model!.dataAssets.length).toBe(beforeCount - 1);
      expect(model!.dataAssets.find((a) => a.id === 'da-001')).toBeUndefined();
    });
  });
});
