/**
 * ThreatGraph.tsx — Main D3 force-directed graph visualization.
 *
 * Pattern: "D3 owns SVG" — D3 manages all SVG rendering imperatively
 * via useEffect; React manages component composition.
 *
 * Phase 1 renders:
 *  - Data flow lines between nodes (edges with arrowhead markers)
 *  - Protocol labels on edges
 *  - Shaped nodes using SVG <path> elements
 *  - Node labels (white text)
 *  - Type-colored node fills
 *
 * Phase 2 adds:
 *  - Layer visibility toggling via graphLayerStore
 *  - Trust boundary hulls (convex hull / ellipse / circle per boundary group)
 */

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useModelStore } from '@/store/modelStore';
import { useGraphLayerStore, StrideCategory } from '@/store/graphLayerStore';
import { useD3Graph, GraphNode, GraphEdge } from '@/hooks/useD3Graph';
import {
  nodeShapePath,
  NODE_TYPE_COLORS,
  STRIDE_COLORS,
  SEVERITY_COLORS,
  generateGlowFilterId,
  STRIDE_CATEGORY_TO_STORE_KEY,
  createRiskRadiusScale,
  createRiskColorScale,
} from '@/components/graph/graphHelpers';
import { threatOracleAPI } from '@/services/api';
import type { ThreatItem } from '@/services/api';
import type { DataFlow, TrustBoundary } from '@/store/sampleData';
import './ThreatGraph.css';

// ---------------------------------------------------------------------------
// Per-node threat aggregation
// ---------------------------------------------------------------------------

interface NodeThreatInfo {
  threats: ThreatItem[];
  maxRiskScore: number;
  threatCount: number;
  strideCategories: Set<string>;
}

// ---------------------------------------------------------------------------
// Trust boundary color map (by security_level)
// ---------------------------------------------------------------------------

const TRUST_BOUNDARY_COLORS: Record<string, string> = {
  public: '#DA77F2',
  dmz: '#FFA94D',
  internal: '#748FFC',
  restricted: '#FF6B6B',
  highly_restricted: '#FF4444',
};

// ---------------------------------------------------------------------------
// Hull helpers
// ---------------------------------------------------------------------------

/** Expand hull points outward from centroid by `pad` pixels. */
function expandPoints(points: [number, number][], pad: number): [number, number][] {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return [px + (dx / dist) * pad, py + (dy / dist) * pad] as [number, number];
  });
}

/** Build a smooth closed path from hull points using cardinal-style curves. */
function smoothHullPath(hullPoints: [number, number][]): string {
  if (hullPoints.length < 3) return '';
  const line = d3.line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1])
    .curve(d3.curveCatmullRomClosed.alpha(0.5));
  return line(hullPoints) || '';
}

// ---------------------------------------------------------------------------
// Boundary membership derivation
// ---------------------------------------------------------------------------

interface BoundaryGroup {
  boundary: TrustBoundary;
  nodeIds: Set<string>;
}

function deriveBoundaryGroups(
  trustBoundaries: TrustBoundary[],
  dataFlows: DataFlow[],
  allNodeIds: string[],
): BoundaryGroup[] {
  // Map from boundary id -> set of associated node ids
  const boundaryNodeMap = new Map<string, Set<string>>();
  for (const tb of trustBoundaries) {
    boundaryNodeMap.set(tb.id, new Set<string>());
  }

  // Assign nodes from crossing flows
  const assignedNodes = new Set<string>();
  for (const flow of dataFlows) {
    if (flow.crosses_trust_boundary && flow.trust_boundary_id) {
      const nodeSet = boundaryNodeMap.get(flow.trust_boundary_id);
      if (nodeSet) {
        // The source of the flow is associated with this boundary
        nodeSet.add(flow.source_id);
        assignedNodes.add(flow.source_id);
        // Also add target if target flow crosses into this boundary
        // (for db zone, the target is in the restricted zone)
        if (flow.trust_boundary_id) {
          nodeSet.add(flow.target_id);
          assignedNodes.add(flow.target_id);
        }
      }
    }
  }

  // Find the default boundary (typically "internal") for unassigned nodes
  const unassigned = allNodeIds.filter((id) => !assignedNodes.has(id));
  if (unassigned.length > 0) {
    // Find a boundary that has no nodes yet, or the "internal" one
    const internalBoundary = trustBoundaries.find(
      (tb) => tb.security_level === 'internal',
    );
    if (internalBoundary) {
      const nodeSet = boundaryNodeMap.get(internalBoundary.id);
      if (nodeSet) {
        for (const id of unassigned) {
          nodeSet.add(id);
        }
      }
    }
  }

  const groups: BoundaryGroup[] = [];
  for (const tb of trustBoundaries) {
    const nodeIds = boundaryNodeMap.get(tb.id);
    if (nodeIds && nodeIds.size > 0) {
      groups.push({ boundary: tb, nodeIds });
    }
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ThreatGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<SVGGElement | null>(null);

  const { getCurrentModel } = useModelStore();
  const currentModel = getCurrentModel();

  // Layer store
  const layers = useGraphLayerStore();

  // Build node and edge arrays with stable identity when data changes
  const nodes: GraphNode[] = useMemo(() => {
    if (!currentModel) return [];
    return currentModel.technicalAssets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      type: asset.type,
    }));
  }, [currentModel]);

  const edges: GraphEdge[] = useMemo(() => {
    if (!currentModel) return [];
    return currentModel.dataFlows.map((flow) => ({
      id: flow.id,
      source: flow.source_id,
      target: flow.target_id,
      label: flow.protocol.toUpperCase(),
    }));
  }, [currentModel]);

  // Derive trust boundary groups
  const boundaryGroups = useMemo(() => {
    if (!currentModel) return [];
    return deriveBoundaryGroups(
      currentModel.trustBoundaries,
      currentModel.dataFlows,
      currentModel.technicalAssets.map((a) => a.id),
    );
  }, [currentModel]);

  // -----------------------------------------------------------------------
  // Threat data fetching
  // -----------------------------------------------------------------------
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const { setThreats: setStoreThreats } = layers;

  useEffect(() => {
    if (!currentModel?.id) {
      setThreats([]);
      setStoreThreats([]);
      return;
    }
    let cancelled = false;
    threatOracleAPI
      .listThreats(currentModel.id)
      .then((resp) => {
        if (!cancelled) {
          const t = resp.threats ?? [];
          setThreats(t);
          setStoreThreats(t);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch threats:', err);
        if (!cancelled) {
          setThreats([]);
          setStoreThreats([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currentModel?.id, setStoreThreats]);

  // -----------------------------------------------------------------------
  // Per-node threat aggregation
  // -----------------------------------------------------------------------
  const nodeThreatMap = useMemo(() => {
    const map = new Map<string, NodeThreatInfo>();
    if (threats.length === 0 || nodes.length === 0) return map;

    // Build name -> id lookup from nodes
    const nameToId = new Map<string, string>();
    for (const node of nodes) {
      nameToId.set(node.name.toLowerCase(), node.id);
    }

    for (const threat of threats) {
      for (const assetName of threat.affected_assets) {
        const nodeId = nameToId.get(assetName.toLowerCase());
        if (!nodeId) continue;

        let info = map.get(nodeId);
        if (!info) {
          info = { threats: [], maxRiskScore: 0, threatCount: 0, strideCategories: new Set() };
          map.set(nodeId, info);
        }
        info.threats.push(threat);
        info.threatCount += 1;
        if (threat.risk_score > info.maxRiskScore) {
          info.maxRiskScore = threat.risk_score;
        }
        info.strideCategories.add(threat.stride_category);
      }
    }
    return map;
  }, [threats, nodes]);

  // Hook manages simulation, zoom, drag, resize
  const { simulation, resetZoom } = useD3Graph(svgRef, containerRef, nodes, edges);

  // Stable callback for keyboard shortcut
  const resetZoomCb = useCallback(() => resetZoom(), [resetZoom]);

  // -----------------------------------------------------------------------
  // Keyboard shortcuts: Escape to deselect, R to reset zoom
  // -----------------------------------------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') layers.clearSelection();
      if (e.key === 'r' || e.key === 'R') resetZoomCb();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [layers, resetZoomCb]);

  // -----------------------------------------------------------------------
  // D3 imperative rendering
  // -----------------------------------------------------------------------
  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    const sim = simulation.current;
    if (!svgEl || !containerEl || !sim || nodes.length === 0) return;

    const containerSel = d3.select<SVGGElement, unknown>(containerEl);

    // Clear previous renders inside layer groups
    containerSel.selectAll('.layer-data-flows > *').remove();
    containerSel.selectAll('.layer-architecture > *').remove();
    containerSel.selectAll('.layer-trust-boundaries > *').remove();

    // ---- Arrowhead marker definition ----
    const defs = d3.select(svgEl).select<SVGDefsElement>('defs');
    defs.selectAll('.arrowhead-def').remove();

    defs
      .append('marker')
      .attr('class', 'arrowhead-def')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 0 10 7')
      .attr('refX', 28)
      .attr('refY', 3.5)
      .attr('markerWidth', 8)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path')
      .attr('d', 'M 0 0 L 10 3.5 L 0 7 Z')
      .attr('class', 'arrowhead-marker');

    // ---- Data flow links ----
    const linksLayer = containerSel.select<SVGGElement>('.layer-data-flows');

    const linkSel = linksLayer
      .selectAll<SVGLineElement, GraphEdge>('.data-flow-link')
      .data(edges, (d) => d.id);

    linkSel.exit().remove();

    const linkEnter = linkSel
      .enter()
      .append('line')
      .attr('class', 'data-flow-link animated-flow')
      .attr('marker-end', 'url(#arrowhead)');

    const linkMerged = linkEnter.merge(linkSel);

    // Edge click handler
    linkMerged.on('click', (event: MouseEvent, d: GraphEdge) => {
      event.stopPropagation();
      layers.setSelectedEdge(d.id);
    });

    // ---- Edge labels ----
    const edgeLabelSel = linksLayer
      .selectAll<SVGTextElement, GraphEdge>('.edge-label')
      .data(edges, (d) => d.id);

    edgeLabelSel.exit().remove();

    const edgeLabelEnter = edgeLabelSel
      .enter()
      .append('text')
      .attr('class', 'edge-label');

    const edgeLabelMerged = edgeLabelEnter.merge(edgeLabelSel);
    edgeLabelMerged.text((d) => d.label);

    // ---- Architecture layer (nodes) ----
    const nodesLayer = containerSel.select<SVGGElement>('.layer-architecture');

    // Node groups (shape + label)
    const nodeGroupSel = nodesLayer
      .selectAll<SVGGElement, GraphNode>('.node-group')
      .data(nodes, (d) => d.id);

    nodeGroupSel.exit().remove();

    const nodeGroupEnter = nodeGroupSel.enter().append('g').attr('class', 'node-group');

    // Shape path
    nodeGroupEnter
      .append('path')
      .attr('class', 'node-shape')
      .attr('d', (d) => nodeShapePath(d.type))
      .attr('fill', (d) => NODE_TYPE_COLORS[d.type] || NODE_TYPE_COLORS.other)
      .attr('fill-opacity', 0.85)
      .attr('stroke', (d) => NODE_TYPE_COLORS[d.type] || NODE_TYPE_COLORS.other);

    // Label
    nodeGroupEnter
      .append('text')
      .attr('class', 'node-label')
      .attr('dy', 30)
      .text((d) => d.name);

    const nodeGroupMerged = nodeGroupEnter.merge(nodeGroupSel);

    // ---- Drag ----
    const dragBehavior = (
      sim as d3.Simulation<GraphNode, GraphEdge> & {
        dragBehavior?: d3.DragBehavior<SVGGElement, GraphNode, GraphNode | d3.SubjectPosition>;
      }
    ).dragBehavior;

    if (dragBehavior) {
      nodeGroupMerged.call(
        dragBehavior as unknown as d3.DragBehavior<SVGGElement, GraphNode, GraphNode | d3.SubjectPosition>,
      );
    }

    // Node click handler
    nodeGroupMerged.on('click', (event: MouseEvent, d: GraphNode) => {
      event.stopPropagation();
      layers.setSelectedNode(d.id);
    });

    // Background click to deselect
    d3.select(svgEl).on('click', () => {
      layers.clearSelection();
    });

    // ---- Trust boundary hulls ----
    const trustLayer = containerSel.select<SVGGElement>('.layer-trust-boundaries');

    // Create a group for each boundary
    const boundaryGroupSel = trustLayer
      .selectAll<SVGGElement, BoundaryGroup>('.trust-boundary-group')
      .data(boundaryGroups, (d) => d.boundary.id);

    boundaryGroupSel.exit().remove();

    const boundaryGroupEnter = boundaryGroupSel
      .enter()
      .append('g')
      .attr('class', 'trust-boundary-group');

    // Hull path
    boundaryGroupEnter
      .append('path')
      .attr('class', 'trust-hull-path');

    // Label background rect
    boundaryGroupEnter
      .append('rect')
      .attr('class', 'trust-hull-label-bg');

    // Label text
    boundaryGroupEnter
      .append('text')
      .attr('class', 'trust-hull-label');

    const boundaryGroupMerged = boundaryGroupEnter.merge(boundaryGroupSel);

    // Apply colors
    boundaryGroupMerged.select<SVGPathElement>('.trust-hull-path')
      .attr('stroke', (d) => TRUST_BOUNDARY_COLORS[d.boundary.security_level || 'internal'] || '#748FFC')
      .attr('fill', (d) => TRUST_BOUNDARY_COLORS[d.boundary.security_level || 'internal'] || '#748FFC');

    boundaryGroupMerged.select<SVGTextElement>('.trust-hull-label')
      .text((d) => d.boundary.name);

    // ---- Update hull positions function (called on tick) ----
    function updateTrustHulls() {
      boundaryGroupMerged.each(function (d) {
        const group = d3.select(this);
        const memberNodes: GraphNode[] = [];
        for (const node of nodes) {
          if (d.nodeIds.has(node.id)) {
            memberNodes.push(node);
          }
        }

        if (memberNodes.length === 0) return;

        const pathEl = group.select<SVGPathElement>('.trust-hull-path');
        const labelEl = group.select<SVGTextElement>('.trust-hull-label');
        const labelBg = group.select<SVGRectElement>('.trust-hull-label-bg');
        const color = TRUST_BOUNDARY_COLORS[d.boundary.security_level || 'internal'] || '#748FFC';

        if (memberNodes.length === 1) {
          // Single node: draw a circle
          const n = memberNodes[0];
          const cx = n.x ?? 0;
          const cy = n.y ?? 0;
          const r = 50;
          pathEl.attr('d',
            `M ${cx},${cy - r} A ${r},${r} 0 1,1 ${cx},${cy + r} A ${r},${r} 0 1,1 ${cx},${cy - r} Z`,
          );
          labelEl.attr('x', cx).attr('y', cy - r - 8);
          // Measure label for background
          const bbox = (labelEl.node() as SVGTextElement | null)?.getBBox();
          if (bbox) {
            labelBg
              .attr('x', bbox.x - 4)
              .attr('y', bbox.y - 2)
              .attr('width', bbox.width + 8)
              .attr('height', bbox.height + 4)
              .attr('rx', 4)
              .attr('fill', 'rgba(13, 17, 23, 0.8)')
              .attr('stroke', color)
              .attr('stroke-width', 0.5)
              .attr('stroke-opacity', 0.3);
          }
        } else if (memberNodes.length === 2) {
          // Two nodes: draw expanded capsule/ellipse
          const n1 = memberNodes[0];
          const n2 = memberNodes[1];
          const x1 = n1.x ?? 0;
          const y1 = n1.y ?? 0;
          const x2 = n2.x ?? 0;
          const y2 = n2.y ?? 0;
          const cx = (x1 + x2) / 2;
          const cy = (y1 + y2) / 2;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const rx = dist / 2 + 40;
          const ry = 50;
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

          pathEl.attr('d',
            `M ${cx - rx},${cy} A ${rx},${ry} 0 1,1 ${cx + rx},${cy} A ${rx},${ry} 0 1,1 ${cx - rx},${cy} Z`,
          ).attr('transform', `rotate(${angle},${cx},${cy})`);

          labelEl
            .attr('x', cx)
            .attr('y', cy - ry - 8)
            .attr('transform', '');
          const bbox = (labelEl.node() as SVGTextElement | null)?.getBBox();
          if (bbox) {
            labelBg
              .attr('x', bbox.x - 4)
              .attr('y', bbox.y - 2)
              .attr('width', bbox.width + 8)
              .attr('height', bbox.height + 4)
              .attr('rx', 4)
              .attr('fill', 'rgba(13, 17, 23, 0.8)')
              .attr('stroke', color)
              .attr('stroke-width', 0.5)
              .attr('stroke-opacity', 0.3);
          }
        } else {
          // 3+ nodes: convex hull
          const points: [number, number][] = memberNodes.map((n) => [n.x ?? 0, n.y ?? 0]);
          const hull = d3.polygonHull(points);
          if (hull) {
            const expanded = expandPoints(hull, 40);
            pathEl.attr('d', smoothHullPath(expanded)).attr('transform', '');
          }

          const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
          const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
          // Place label above the topmost point
          const minY = Math.min(...points.map((p) => p[1]));
          labelEl.attr('x', cx).attr('y', minY - 50);
          const bbox = (labelEl.node() as SVGTextElement | null)?.getBBox();
          if (bbox) {
            labelBg
              .attr('x', bbox.x - 4)
              .attr('y', bbox.y - 2)
              .attr('width', bbox.width + 8)
              .attr('height', bbox.height + 4)
              .attr('rx', 4)
              .attr('fill', 'rgba(13, 17, 23, 0.8)')
              .attr('stroke', color)
              .attr('stroke-width', 0.5)
              .attr('stroke-opacity', 0.3);
          }
        }
      });
    }

    // ---- SVG glow filter definitions for STRIDE categories ----
    defs.selectAll('.stride-glow-filter').remove();
    for (const [category, color] of Object.entries(STRIDE_COLORS)) {
      const filter = defs
        .append('filter')
        .attr('class', 'stride-glow-filter')
        .attr('id', generateGlowFilterId(category))
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
      filter
        .append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', '4')
        .attr('result', 'blur');
      filter
        .append('feFlood')
        .attr('flood-color', color)
        .attr('flood-opacity', '0.6')
        .attr('result', 'color');
      filter
        .append('feComposite')
        .attr('in', 'color')
        .attr('in2', 'blur')
        .attr('operator', 'in')
        .attr('result', 'glow');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'glow');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    }

    // ---- Threat layer: glow rings + badges ----
    const threatLayer = containerSel.select<SVGGElement>('.layer-threats');
    threatLayer.selectAll('*').remove();

    // Build data array for nodes that have threats
    interface ThreatNodeDatum {
      nodeId: string;
      info: NodeThreatInfo;
    }
    const threatNodeData: ThreatNodeDatum[] = [];
    for (const node of nodes) {
      const info = nodeThreatMap.get(node.id);
      if (info && info.threatCount > 0) {
        threatNodeData.push({ nodeId: node.id, info });
      }
    }

    // Glow ring groups (one per affected node)
    const glowGroups = threatLayer
      .selectAll<SVGGElement, ThreatNodeDatum>('.threat-glow-group')
      .data(threatNodeData, (d) => d.nodeId)
      .enter()
      .append('g')
      .attr('class', 'threat-glow-group');

    // For each node, pick the highest risk STRIDE category for the glow
    glowGroups.each(function (d) {
      const group = d3.select(this);
      // Find the highest-risk threat to determine glow color
      let maxRisk = 0;
      let topCategory = 'spoofing';
      for (const t of d.info.threats) {
        if (t.risk_score > maxRisk) {
          maxRisk = t.risk_score;
          topCategory = t.stride_category;
        }
      }

      // Find the matching node to get its type for the shape
      const matchingNode = nodes.find((n) => n.id === d.nodeId);
      const nodeType = matchingNode?.type ?? 'other';

      group
        .append('path')
        .attr('class', 'threat-glow-ring')
        .attr('d', nodeShapePath(nodeType, 24)) // slightly larger than node
        .attr('stroke', STRIDE_COLORS[topCategory] || '#FF6B6B')
        .attr('stroke-width', 3)
        .attr('data-stride', topCategory)
        .attr('filter', `url(#${generateGlowFilterId(topCategory)})`);
    });

    // Threat count badges (top-right of each affected node)
    const badgeGroups = threatLayer
      .selectAll<SVGGElement, ThreatNodeDatum>('.threat-badge-group')
      .data(threatNodeData, (d) => d.nodeId)
      .enter()
      .append('g')
      .attr('class', 'threat-badge-group');

    // Threat badge click handler
    badgeGroups.on('click', (event: MouseEvent, d: ThreatNodeDatum) => {
      event.stopPropagation();
      // Select the highest-risk threat for this node
      const topThreat = d.info.threats.reduce((a, b) => (b.risk_score > a.risk_score ? b : a));
      layers.setSelectedThreat(topThreat.threat_id);
    });

    badgeGroups.each(function (d) {
      const group = d3.select(this);
      // Determine badge color from max severity
      let worstSeverity = 'info';
      const severityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
      for (const t of d.info.threats) {
        if ((severityRank[t.severity] ?? 0) > (severityRank[worstSeverity] ?? 0)) {
          worstSeverity = t.severity;
        }
      }

      group
        .append('circle')
        .attr('class', 'threat-badge-circle')
        .attr('r', 8)
        .attr('cx', 18)
        .attr('cy', -18)
        .attr('fill', SEVERITY_COLORS[worstSeverity] || SEVERITY_COLORS.info)
        .attr('stroke', '#0D1117');

      group
        .append('text')
        .attr('class', 'threat-badge-text')
        .attr('x', 18)
        .attr('y', -18)
        .text(String(d.info.threatCount));
    });

    // ---- Risk heatmap layer ----
    const heatmapLayer = containerSel.select<SVGGElement>('.layer-risk-heatmap');
    heatmapLayer.selectAll('*').remove();

    const riskRadius = createRiskRadiusScale();
    const riskColor = createRiskColorScale();

    heatmapLayer
      .selectAll<SVGCircleElement, ThreatNodeDatum>('.risk-heatmap-circle')
      .data(threatNodeData, (d) => d.nodeId)
      .enter()
      .append('circle')
      .attr('class', 'risk-heatmap-circle')
      .attr('r', (d) => riskRadius(d.info.maxRiskScore))
      .attr('fill', (d) => riskColor(d.info.maxRiskScore));

    // ---- Simulation tick ----
    sim.on('tick', () => {
      linkMerged
        .attr('x1', (d) => ((d.source as GraphNode).x ?? 0))
        .attr('y1', (d) => ((d.source as GraphNode).y ?? 0))
        .attr('x2', (d) => ((d.target as GraphNode).x ?? 0))
        .attr('y2', (d) => ((d.target as GraphNode).y ?? 0));

      edgeLabelMerged
        .attr('x', (d) => (((d.source as GraphNode).x ?? 0) + ((d.target as GraphNode).x ?? 0)) / 2)
        .attr('y', (d) => (((d.source as GraphNode).y ?? 0) + ((d.target as GraphNode).y ?? 0)) / 2 - 6);

      nodeGroupMerged.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);

      // Update trust boundary hulls on every tick
      updateTrustHulls();

      // Update threat glow ring + badge positions
      glowGroups.each(function (d) {
        const matchingNode = nodes.find((n) => n.id === d.nodeId);
        if (matchingNode) {
          d3.select(this).attr('transform', `translate(${matchingNode.x ?? 0},${matchingNode.y ?? 0})`);
        }
      });
      badgeGroups.each(function (d) {
        const matchingNode = nodes.find((n) => n.id === d.nodeId);
        if (matchingNode) {
          d3.select(this).attr('transform', `translate(${matchingNode.x ?? 0},${matchingNode.y ?? 0})`);
        }
      });

      // Update risk heatmap circle positions
      heatmapLayer.selectAll<SVGCircleElement, ThreatNodeDatum>('.risk-heatmap-circle')
        .attr('cx', (d) => {
          const n = nodes.find((node) => node.id === d.nodeId);
          return n?.x ?? 0;
        })
        .attr('cy', (d) => {
          const n = nodes.find((node) => node.id === d.nodeId);
          return n?.y ?? 0;
        });
    });

    // Restart to ensure tick fires with our new selections
    sim.alpha(0.5).restart();
  }, [nodes, edges, simulation, boundaryGroups, nodeThreatMap]);

  // -----------------------------------------------------------------------
  // Layer visibility effect — runs when layer toggles change
  // -----------------------------------------------------------------------
  useEffect(() => {
    const containerEl = containerRef.current;
    if (!containerEl) return;

    const containerSel = d3.select<SVGGElement, unknown>(containerEl);

    containerSel.select('.layer-trust-boundaries')
      .style('opacity', layers.trustBoundaries ? 1 : 0)
      .style('pointer-events', layers.trustBoundaries ? 'auto' : 'none');

    containerSel.select('.layer-data-flows')
      .style('opacity', layers.dataFlows ? 1 : 0)
      .style('pointer-events', layers.dataFlows ? 'auto' : 'none');

    // architecture always visible
    containerSel.select('.layer-architecture')
      .style('opacity', 1)
      .style('pointer-events', 'auto');

    containerSel.select('.layer-threats')
      .style('opacity', layers.strideThreats ? 1 : 0)
      .style('pointer-events', layers.strideThreats ? 'auto' : 'none');

    // STRIDE category sub-filtering: hide glow rings for disabled categories
    if (layers.strideThreats) {
      containerSel.select('.layer-threats')
        .selectAll<SVGPathElement, unknown>('.threat-glow-ring')
        .each(function () {
          const el = d3.select(this);
          const strideCategory = el.attr('data-stride') || '';
          const storeKey = STRIDE_CATEGORY_TO_STORE_KEY[strideCategory] as StrideCategory | undefined;
          const isVisible = storeKey ? layers[storeKey] : true;
          el.style('display', isVisible ? '' : 'none');
        });
    }

    containerSel.select('.layer-risk-heatmap')
      .style('opacity', layers.riskHeatmap ? 1 : 0)
      .style('pointer-events', layers.riskHeatmap ? 'auto' : 'none');

    containerSel.select('.layer-knowledge-graph')
      .style('opacity', layers.knowledgeGraph ? 1 : 0)
      .style('pointer-events', layers.knowledgeGraph ? 'auto' : 'none');

    // ---- Selection highlighting ----
    const { selectedNodeId, selectedEdgeId } = layers;

    // Node selection highlight
    containerSel.select('.layer-architecture')
      .selectAll<SVGPathElement, unknown>('.node-shape')
      .classed('selected', false)
      .classed('dimmed', false);

    if (selectedNodeId) {
      containerSel.select('.layer-architecture')
        .selectAll<SVGGElement, GraphNode>('.node-group')
        .each(function (d) {
          const shape = d3.select(this).select<SVGPathElement>('.node-shape');
          if (d.id === selectedNodeId) {
            shape.classed('selected', true);
          } else {
            shape.classed('dimmed', true);
          }
        });
    }

    // Edge selection highlight
    containerSel.select('.layer-data-flows')
      .selectAll<SVGLineElement, unknown>('.data-flow-link')
      .classed('selected', false)
      .classed('dimmed', false);

    if (selectedEdgeId) {
      containerSel.select('.layer-data-flows')
        .selectAll<SVGLineElement, GraphEdge>('.data-flow-link')
        .each(function (d) {
          const el = d3.select(this);
          if (d.id === selectedEdgeId) {
            el.classed('selected', true);
          } else {
            el.classed('dimmed', true);
          }
        });
    }
  }, [
    layers.trustBoundaries,
    layers.dataFlows,
    layers.strideThreats,
    layers.riskHeatmap,
    layers.knowledgeGraph,
    layers.spoofing,
    layers.tampering,
    layers.repudiation,
    layers.informationDisclosure,
    layers.denialOfService,
    layers.elevationOfPrivilege,
    layers.selectedNodeId,
    layers.selectedEdgeId,
  ]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (!currentModel || nodes.length === 0) {
    return (
      <div className="threat-graph-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--graph-muted)', fontSize: 14 }}>
          No data to visualize. Select a model with technical assets.
        </span>
      </div>
    );
  }

  return (
    <div className="threat-graph-container">
      <svg ref={svgRef} className="threat-graph-svg">
        <defs />
        <g ref={containerRef} className="zoom-container">
          <g className="layer-trust-boundaries" />
          <g className="layer-data-flows" />
          <g className="layer-architecture" />
          <g className="layer-threats" />
          <g className="layer-risk-heatmap" />
          <g className="layer-knowledge-graph" />
        </g>
      </svg>
      <button
        className="threat-graph-reset-zoom"
        onClick={resetZoom}
        type="button"
        title="Reset zoom"
      >
        Reset View
      </button>
    </div>
  );
};

export default ThreatGraph;
