import { describe, it, expect, beforeEach, vi } from 'vitest';

// We need to mock fetch before importing the module
const mockFetch = vi.fn();
global.fetch = mockFetch;

import { threatOracleAPI } from '../api';

function mockJsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  };
}

describe('threatOracleAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listModels', () => {
    it('calls correct URL', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ models: [], skip: 0, limit: 50 }));

      await threatOracleAPI.listModels();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models',
        expect.objectContaining({
          credentials: 'same-origin',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          }),
        }),
      );
    });

    it('appends query params when provided', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ models: [], skip: 10, limit: 5 }));

      await threatOracleAPI.listModels({ skip: 10, limit: 5 });

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain('skip=10');
      expect(callUrl).toContain('limit=5');
    });
  });

  describe('getModel', () => {
    it('calls correct URL with model ID', async () => {
      const mockResp = {
        model: { model_id: 'abc', name: 'Test', description: '', version: '1.0', repo_url: '', created: '', updated: '' },
        technical_assets: [],
        trust_boundaries: [],
        data_flows: [],
        data_assets: [],
      };
      mockFetch.mockResolvedValue(mockJsonResponse(mockResp));

      await threatOracleAPI.getModel('abc');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models/abc',
        expect.any(Object),
      );
    });

    it('encodes special characters in model ID', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ model: {}, technical_assets: [], trust_boundaries: [], data_flows: [], data_assets: [] }));

      await threatOracleAPI.getModel('model/with spaces');

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toBe('/api/v1/models/model%2Fwith%20spaces');
    });
  });

  describe('createModel', () => {
    it('POSTs to correct URL with body', async () => {
      const input = { name: 'New Model', description: 'Desc', version: '0.1.0' };
      mockFetch.mockResolvedValue(
        mockJsonResponse({ model_id: 'new-1', name: 'New Model', description: 'Desc', version: '0.1.0', repo_url: '', created: '', updated: '' }),
      );

      await threatOracleAPI.createModel(input);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(input),
        }),
      );
    });
  });

  describe('updateModel', () => {
    it('PUTs to correct URL with body', async () => {
      const updates = { name: 'Updated' };
      mockFetch.mockResolvedValue(
        mockJsonResponse({ model_id: 'abc', name: 'Updated', description: '', version: '1.0', repo_url: '', created: '', updated: '' }),
      );

      await threatOracleAPI.updateModel('abc', updates);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models/abc',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
      );
    });
  });

  describe('deleteModel', () => {
    it('DELETEs correct URL', async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({ status: 'deleted', model_id: 'abc' }),
      );

      await threatOracleAPI.deleteModel('abc');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models/abc',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });

  describe('triggerAnalysis', () => {
    it('POSTs with correct headers', async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({ job_id: 'job-1', model_id: 'abc', status: 'pending', message: 'started' }),
      );

      const llmHeaders = { 'X-Anthropic-Api-Key': 'test-key' };
      await threatOracleAPI.triggerAnalysis('abc', 'tier_2', llmHeaders);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models/abc/analyze',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ tier: 'tier_2' }),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-Anthropic-Api-Key': 'test-key',
          }),
        }),
      );
    });
  });

  describe('getAnalysisStatus', () => {
    it('GETs correct URL', async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({
          job_id: 'job-1',
          model_id: 'abc',
          tier: 'tier_1',
          status: 'completed',
          progress_pct: 100,
          current_phase: null,
          units_completed: 10,
          units_total: 10,
          threats_found: 3,
          error: null,
          started_at: '',
          completed_at: '',
        }),
      );

      await threatOracleAPI.getAnalysisStatus('abc', 'job-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models/abc/analyze/job-1',
        expect.any(Object),
      );
    });
  });

  describe('listThreats', () => {
    it('GETs correct URL', async () => {
      mockFetch.mockResolvedValue(
        mockJsonResponse({ model_id: 'abc', threats: [], total: 0 }),
      );

      await threatOracleAPI.listThreats('abc');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/models/abc/threats',
        expect.any(Object),
      );
    });
  });

  describe('error handling', () => {
    it('throws user-friendly message for 5xx errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ detail: 'Internal error' }),
      });

      await expect(threatOracleAPI.listModels()).rejects.toThrow(
        'An internal error occurred. Please try again later.',
      );
    });

    it('throws status-based message for 4xx errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      await expect(threatOracleAPI.getModel('nonexistent')).rejects.toThrow(
        'Request failed (404)',
      );
    });

    it('throws status-based message for 401 errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Unauthorized' }),
      });

      await expect(threatOracleAPI.listModels()).rejects.toThrow(
        'Request failed (401)',
      );
    });
  });

  describe('API base URL configuration', () => {
    it('uses /api/v1 as base path', async () => {
      mockFetch.mockResolvedValue(mockJsonResponse({ models: [], skip: 0, limit: 50 }));

      await threatOracleAPI.listModels();

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toMatch(/^\/api\/v1\//);
    });
  });
});
