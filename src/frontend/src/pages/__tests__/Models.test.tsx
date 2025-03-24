import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import Models from '../Models';
import { useModelStore } from '@/store/modelStore';

// Mock the store
vi.mock('@/store/modelStore', () => ({
  useModelStore: vi.fn()
}));

// Mock window.confirm
const originalConfirm = window.confirm;
window.confirm = vi.fn();

describe('Models Page', () => {
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
      dataFlows: [{ id: 'flow-1' }],
      dataAssets: [{ id: 'data-1' }]
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
      dataFlows: [],
      dataAssets: []
    }
  ];
  
  const mockSetCurrentModel = vi.fn();
  const mockAddModel = vi.fn();
  const mockDeleteModel = vi.fn();
  
  beforeEach(() => {
    (useModelStore as any).mockReturnValue({
      models: mockModels,
      currentModelId: 'model-1',
      setCurrentModel: mockSetCurrentModel,
      addModel: mockAddModel,
      deleteModel: mockDeleteModel
    });
    
    // Reset mocks
    vi.clearAllMocks();
    (window.confirm as any).mockReturnValue(true);
  });
  
  afterAll(() => {
    window.confirm = originalConfirm;
  });
  
  it('renders the models list', () => {
    render(<Models />);
    
    // Check if the page title is rendered
    expect(screen.getByText('Threat Models')).toBeInTheDocument();
    
    // Check if both models are rendered
    expect(screen.getByText('Test Model 1')).toBeInTheDocument();
    expect(screen.getByText('Test Model 2')).toBeInTheDocument();
  });
  
  it('selects a model when clicked', () => {
    render(<Models />);
    
    // Click on the second model
    fireEvent.click(screen.getByText('Test Model 2'));
    
    // Check if setCurrentModel was called with the correct model ID
    expect(mockSetCurrentModel).toHaveBeenCalledWith('model-2');
  });
  
  it('opens the create model form when the create button is clicked', () => {
    render(<Models />);
    
    // Click on the create button
    fireEvent.click(screen.getByText('Create New Model'));
    
    // Check if the form is displayed
    expect(screen.getByText('Create New Model', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByLabelText('Model Name:')).toBeInTheDocument();
  });
  
  it('creates a new model when the form is submitted', () => {
    render(<Models />);
    
    // Click on the create button
    fireEvent.click(screen.getByText('Create New Model'));
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Model Name:'), { target: { value: 'New Test Model' } });
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'New test description' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create', { selector: 'button[type="submit"]' }));
    
    // Check if addModel was called with the correct parameters
    expect(mockAddModel).toHaveBeenCalledWith({
      name: 'New Test Model',
      description: 'New test description',
      version: '0.1.0',
      technicalAssets: [],
      trustBoundaries: [],
      dataFlows: [],
      dataAssets: []
    });
  });
  
  it('deletes a model when the delete button is clicked', () => {
    render(<Models />);
    
    // Find all delete buttons and click the first one
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Check if window.confirm was called
    expect(window.confirm).toHaveBeenCalled();
    
    // Check if deleteModel was called with the correct model ID
    expect(mockDeleteModel).toHaveBeenCalledWith('model-1');
  });
});
