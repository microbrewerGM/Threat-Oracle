/**
 * graphLayerStore.ts — Zustand store managing graph layer visibility,
 * STRIDE category filters, selection state, and search.
 */

import { create } from 'zustand';
import type { ThreatItem } from '@/services/api';

// ---------------------------------------------------------------------------
// Layer toggle keys
// ---------------------------------------------------------------------------

export type LayerKey =
  | 'trustBoundaries'
  | 'dataFlows'
  | 'architecture'
  | 'strideThreats'
  | 'riskHeatmap'
  | 'knowledgeGraph';

// ---------------------------------------------------------------------------
// STRIDE category keys
// ---------------------------------------------------------------------------

export type StrideCategory =
  | 'spoofing'
  | 'tampering'
  | 'repudiation'
  | 'informationDisclosure'
  | 'denialOfService'
  | 'elevationOfPrivilege';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface GraphLayerState {
  // Layer visibility toggles
  trustBoundaries: boolean;
  dataFlows: boolean;
  architecture: boolean;
  strideThreats: boolean;
  riskHeatmap: boolean;
  knowledgeGraph: boolean;

  // STRIDE category filters
  spoofing: boolean;
  tampering: boolean;
  repudiation: boolean;
  informationDisclosure: boolean;
  denialOfService: boolean;
  elevationOfPrivilege: boolean;

  // Selection state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedThreatId: string | null;

  // Shared threat data (written by ThreatGraph, read by DetailPanel)
  threats: ThreatItem[];

  // Search
  searchQuery: string;

  // Actions
  toggleLayer: (layer: LayerKey) => void;
  toggleStrideCategory: (category: StrideCategory) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setSelectedThreat: (id: string | null) => void;
  clearSelection: () => void;
  setSearchQuery: (query: string) => void;
  setThreats: (threats: ThreatItem[]) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGraphLayerStore = create<GraphLayerState>((set) => ({
  // Layer defaults
  trustBoundaries: false,
  dataFlows: true,
  architecture: true,
  strideThreats: false,
  riskHeatmap: false,
  knowledgeGraph: false,

  // STRIDE defaults — all ON
  spoofing: true,
  tampering: true,
  repudiation: true,
  informationDisclosure: true,
  denialOfService: true,
  elevationOfPrivilege: true,

  // Shared threat data
  threats: [],

  // Selection defaults
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedThreatId: null,

  // Search default
  searchQuery: '',

  // Actions
  toggleLayer: (layer) =>
    set((state) => {
      // architecture is locked — toggling does nothing
      if (layer === 'architecture') return state;
      return { [layer]: !state[layer] };
    }),

  toggleStrideCategory: (category) =>
    set((state) => ({ [category]: !state[category] })),

  setSelectedNode: (id) =>
    set({ selectedNodeId: id, selectedEdgeId: null, selectedThreatId: null }),

  setSelectedEdge: (id) =>
    set({ selectedNodeId: null, selectedEdgeId: id, selectedThreatId: null }),

  setSelectedThreat: (id) =>
    set({ selectedNodeId: null, selectedEdgeId: null, selectedThreatId: id }),

  clearSelection: () =>
    set({ selectedNodeId: null, selectedEdgeId: null, selectedThreatId: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setThreats: (threats) => set({ threats }),
}));
