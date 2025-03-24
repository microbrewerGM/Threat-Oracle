import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ModelSelector from '../ModelSelector';
import { useModelStore } from '@/store/modelStore';

// Mock the store
vi.mock('@/store/modelStore', () => ({
  useModelStore: vi.fn()
}));

describe('ModelSelector', () => {
  const mockModels = [
    {
      id: 'model-1',
      name: 'Test Model 1',
      description: 'Test description 1',
      version: '1.0.0',
      created: '2025-03-23T12:00:00Z',
      updated: '2025-03-23T12:00:00Z',
      technicalAssets: [{ id: 'asset-1' }],
      trustBoundaries: [{ id: 'boundary-1' }],
      dataFlows: [{ id: 'flow-1' }]
    },
    {
      id: 'model-2',
      name: 'Test Model 2',
      description: 'Test description 2',
      version: '1.0.0',
      created: '2025-03-23T12:00:00Z',
      updated: '2025-03-23T12:00:00Z',
      technicalAssets: [],
      trustBoundaries: [],
      dataFlows: []
    }
  ];
  
  const mockSetCurrentModel = vi.fn();
  
  beforeEach(() => {
    (useModelStore as any).mockReturnValue({
      models: mockModels,
      currentModelId: 'model-1',
      setCurrentModel: mockSetCurrentModel
    });
  });
  
  it('renders the component with model information', () => {
    render(<ModelSelector />);
    
    // Check if the component renders the model selector
    expect(screen.getByLabelText(/current model/i)).toBeInTheDocument();
    
    // Check if the model details are displayed
    expect(screen.getByText('Test description 1')).toBeInTheDocument();
    
    // Check if the asset counts are displayed
    const assetCounts = screen.getAllByText('1');
    expect(assetCounts.length).toBe(3); // Technical assets, trust boundaries, and data flows
  });
  
  it('calls setCurrentModel when a different model is selected', () => {
    render(<ModelSelector />);
    
    // Get the select element
    const select = screen.getByLabelText(/current model/i);
    
    // Change the selected model
    fireEvent.change(select, { target: { value: 'model-2' } });
    
    // Check if setCurrentModel was called with the correct model ID
    expect(mockSetCurrentModel).toHaveBeenCalledWith('model-2');
  });
});
