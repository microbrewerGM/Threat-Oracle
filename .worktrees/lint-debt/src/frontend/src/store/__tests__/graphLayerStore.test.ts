/**
 * graphLayerStore.test.ts — Unit tests for the graph layer Zustand store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGraphLayerStore } from '@/store/graphLayerStore';
import type { ThreatItem } from '@/services/api';

const initialState = {
  trustBoundaries: false,
  dataFlows: true,
  architecture: true,
  strideThreats: false,
  riskHeatmap: false,
  knowledgeGraph: false,
  spoofing: true,
  tampering: true,
  repudiation: true,
  informationDisclosure: true,
  denialOfService: true,
  elevationOfPrivilege: true,
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedThreatId: null,
  searchQuery: '',
  threats: [],
};

describe('graphLayerStore', () => {
  beforeEach(() => {
    useGraphLayerStore.setState(initialState);
  });

  // -------------------------------------------------------------------------
  // Default state
  // -------------------------------------------------------------------------

  it('has correct default layer visibility', () => {
    const s = useGraphLayerStore.getState();
    expect(s.trustBoundaries).toBe(false);
    expect(s.dataFlows).toBe(true);
    expect(s.architecture).toBe(true);
    expect(s.strideThreats).toBe(false);
    expect(s.riskHeatmap).toBe(false);
    expect(s.knowledgeGraph).toBe(false);
  });

  it('has all STRIDE filters enabled by default', () => {
    const s = useGraphLayerStore.getState();
    expect(s.spoofing).toBe(true);
    expect(s.tampering).toBe(true);
    expect(s.repudiation).toBe(true);
    expect(s.informationDisclosure).toBe(true);
    expect(s.denialOfService).toBe(true);
    expect(s.elevationOfPrivilege).toBe(true);
  });

  it('has null selections, empty search, and empty threats by default', () => {
    const s = useGraphLayerStore.getState();
    expect(s.selectedNodeId).toBeNull();
    expect(s.selectedEdgeId).toBeNull();
    expect(s.selectedThreatId).toBeNull();
    expect(s.searchQuery).toBe('');
    expect(s.threats).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // toggleLayer
  // -------------------------------------------------------------------------

  it('toggleLayer turns trustBoundaries ON then OFF', () => {
    useGraphLayerStore.getState().toggleLayer('trustBoundaries');
    expect(useGraphLayerStore.getState().trustBoundaries).toBe(true);

    useGraphLayerStore.getState().toggleLayer('trustBoundaries');
    expect(useGraphLayerStore.getState().trustBoundaries).toBe(false);
  });

  it('toggleLayer on architecture is a no-op (locked)', () => {
    useGraphLayerStore.getState().toggleLayer('architecture');
    expect(useGraphLayerStore.getState().architecture).toBe(true);
  });

  it('toggleLayer on strideThreats does not affect other layers', () => {
    useGraphLayerStore.getState().toggleLayer('strideThreats');
    const s = useGraphLayerStore.getState();
    expect(s.strideThreats).toBe(true);
    expect(s.trustBoundaries).toBe(false);
    expect(s.dataFlows).toBe(true);
    expect(s.architecture).toBe(true);
    expect(s.riskHeatmap).toBe(false);
    expect(s.knowledgeGraph).toBe(false);
  });

  // -------------------------------------------------------------------------
  // toggleStrideCategory
  // -------------------------------------------------------------------------

  it('toggleStrideCategory toggles spoofing OFF and back ON', () => {
    useGraphLayerStore.getState().toggleStrideCategory('spoofing');
    expect(useGraphLayerStore.getState().spoofing).toBe(false);

    useGraphLayerStore.getState().toggleStrideCategory('spoofing');
    expect(useGraphLayerStore.getState().spoofing).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Selection
  // -------------------------------------------------------------------------

  it('setSelectedNode sets node and clears edge and threat', () => {
    useGraphLayerStore.getState().setSelectedNode('node-1');
    const s = useGraphLayerStore.getState();
    expect(s.selectedNodeId).toBe('node-1');
    expect(s.selectedEdgeId).toBeNull();
    expect(s.selectedThreatId).toBeNull();
  });

  it('setSelectedEdge sets edge and clears node and threat', () => {
    useGraphLayerStore.getState().setSelectedEdge('edge-1');
    const s = useGraphLayerStore.getState();
    expect(s.selectedEdgeId).toBe('edge-1');
    expect(s.selectedNodeId).toBeNull();
    expect(s.selectedThreatId).toBeNull();
  });

  it('setSelectedThreat sets threat and clears node and edge', () => {
    useGraphLayerStore.getState().setSelectedThreat('threat-1');
    const s = useGraphLayerStore.getState();
    expect(s.selectedThreatId).toBe('threat-1');
    expect(s.selectedNodeId).toBeNull();
    expect(s.selectedEdgeId).toBeNull();
  });

  it('clearSelection nulls all selections', () => {
    useGraphLayerStore.getState().setSelectedNode('node-1');
    useGraphLayerStore.getState().clearSelection();
    const s = useGraphLayerStore.getState();
    expect(s.selectedNodeId).toBeNull();
    expect(s.selectedEdgeId).toBeNull();
    expect(s.selectedThreatId).toBeNull();
  });

  it('selections are mutually exclusive — setting edge clears node', () => {
    useGraphLayerStore.getState().setSelectedNode('node-1');
    useGraphLayerStore.getState().setSelectedEdge('edge-1');
    const s = useGraphLayerStore.getState();
    expect(s.selectedNodeId).toBeNull();
    expect(s.selectedEdgeId).toBe('edge-1');
  });

  // -------------------------------------------------------------------------
  // Search & threats
  // -------------------------------------------------------------------------

  it('setSearchQuery updates searchQuery', () => {
    useGraphLayerStore.getState().setSearchQuery('web server');
    expect(useGraphLayerStore.getState().searchQuery).toBe('web server');
  });

  it('setThreats stores the threats array', () => {
    const threats: ThreatItem[] = [
      {
        threat_id: 't-1',
        title: 'SQL Injection',
        stride_category: 'tampering',
        severity: 'high',
        likelihood: 'medium',
        risk_score: 7,
        attack_vector: 'network',
        description: 'desc',
        remediation: 'fix',
        confidence: 0.9,
        cwe_ids: ['CWE-89'],
        capec_ids: [],
        attack_technique_ids: [],
        affected_assets: ['db-1'],
        analysis_tier: 'deep',
        job_id: 'j-1',
      },
    ];
    useGraphLayerStore.getState().setThreats(threats);
    expect(useGraphLayerStore.getState().threats).toEqual(threats);
    expect(useGraphLayerStore.getState().threats).toHaveLength(1);
  });
});
