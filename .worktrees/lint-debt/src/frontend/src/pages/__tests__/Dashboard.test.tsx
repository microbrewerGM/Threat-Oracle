import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from '../Dashboard';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the model store
vi.mock('@/store/modelStore', () => ({
  useModelStore: vi.fn(() => ({
    getCurrentModel: () => ({
      id: 'model-1',
      name: 'Test Model',
      description: 'Test description',
      version: '1.0.0',
      created: '2025-01-01T00:00:00Z',
      updated: '2025-01-01T00:00:00Z',
      technicalAssets: [{ id: 'ta-1' }, { id: 'ta-2' }],
      trustBoundaries: [{ id: 'tb-1' }],
      dataFlows: [{ id: 'df-1' }],
      dataAssets: [],
    }),
  })),
}));

// Mock ModelSelector to avoid its internal hooks
vi.mock('@/components/model/ModelSelector', () => ({
  default: () => <div data-testid="model-selector">ModelSelector</div>,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard heading', () => {
    render(<Dashboard />);

    expect(screen.getByText('Threat Oracle Dashboard')).toBeInTheDocument();
  });

  it('renders dashboard cards', () => {
    render(<Dashboard />);

    expect(screen.getByText('Technical Assets')).toBeInTheDocument();
    expect(screen.getByText('Trust Boundaries')).toBeInTheDocument();
    expect(screen.getByText('Data Flows')).toBeInTheDocument();
    expect(screen.getByText('Visualization')).toBeInTheDocument();
  });

  it('renders the ModelSelector component', () => {
    render(<Dashboard />);

    expect(screen.getByTestId('model-selector')).toBeInTheDocument();
  });

  it('navigation links work — View Assets navigates to /technical-assets', () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByText('View Assets'));
    expect(mockNavigate).toHaveBeenCalledWith('/technical-assets');
  });

  it('navigation links work — View Boundaries navigates to /trust-boundaries', () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByText('View Boundaries'));
    expect(mockNavigate).toHaveBeenCalledWith('/trust-boundaries');
  });

  it('navigation links work — View Flows navigates to /data-flows', () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByText('View Flows'));
    expect(mockNavigate).toHaveBeenCalledWith('/data-flows');
  });

  it('navigation links work — View Graph navigates to /visualization', () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByText('View Graph'));
    expect(mockNavigate).toHaveBeenCalledWith('/visualization');
  });

  it('renders getting started section', () => {
    render(<Dashboard />);

    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText(/Create technical assets/)).toBeInTheDocument();
  });

  it('renders welcome description', () => {
    render(<Dashboard />);

    expect(screen.getByText(/Welcome to Threat Oracle/)).toBeInTheDocument();
  });
});
