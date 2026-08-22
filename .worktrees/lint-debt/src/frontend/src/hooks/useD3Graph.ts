/**
 * useD3Graph.ts — Custom hook that manages a D3 force simulation lifecycle.
 *
 * Owns the simulation, zoom behavior, drag handlers, and responsive resizing.
 * The caller provides SVG + container refs and data; this hook wires D3.
 */

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { nodeCollisionRadius } from '@/components/graph/graphHelpers';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: string;
}

export interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

export interface UseD3GraphOptions {
  /** Repulsion strength (default -300) */
  chargeStrength?: number;
  /** Link distance (default 120) */
  linkDistance?: number;
  /** Centering force strength for X/Y (default 0.05) */
  centeringStrength?: number;
  /** Node base size for collision calc (default 18) */
  nodeSize?: number;
  /** Zoom scale extent (default [0.1, 4]) */
  zoomExtent?: [number, number];
}

export interface UseD3GraphReturn {
  simulation: React.MutableRefObject<d3.Simulation<GraphNode, GraphEdge> | null>;
  zoomBehavior: React.MutableRefObject<d3.ZoomBehavior<SVGSVGElement, unknown> | null>;
  resetZoom: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useD3Graph(
  svgRef: React.RefObject<SVGSVGElement | null>,
  containerRef: React.RefObject<SVGGElement | null>,
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: UseD3GraphOptions = {},
): UseD3GraphReturn {
  const {
    chargeStrength = -300,
    linkDistance = 120,
    centeringStrength = 0.05,
    nodeSize = 18,
    zoomExtent = [0.1, 4] as [number, number],
  } = options;

  const simulationRef = useRef<d3.Simulation<GraphNode, GraphEdge> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Reset zoom to identity transform
  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    const zoom = zoomRef.current;
    if (svg && zoom) {
      d3.select<SVGSVGElement, unknown>(svg)
        .transition()
        .duration(500)
        .call(zoom.transform, d3.zoomIdentity);
    }
  }, [svgRef]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const containerEl = containerRef.current;
    if (!svgEl || !containerEl || nodes.length === 0) return;

    const svgSel = d3.select<SVGSVGElement, unknown>(svgEl);
    const containerSel = d3.select<SVGGElement, unknown>(containerEl);

    // --- Dimensions ---
    const parentEl = svgEl.parentElement;
    let width = parentEl ? parentEl.clientWidth : 800;
    let height = parentEl ? parentEl.clientHeight : 600;

    // --- Force simulation ---
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphEdge>(edges)
          .id((d) => d.id)
          .distance(linkDistance),
      )
      .force('charge', d3.forceManyBody<GraphNode>().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('x', d3.forceX<GraphNode>(width / 2).strength(centeringStrength))
      .force('y', d3.forceY<GraphNode>(height / 2).strength(centeringStrength))
      .force(
        'collide',
        d3.forceCollide<GraphNode>().radius((d) => nodeCollisionRadius(d.type, nodeSize) + 12),
      );

    simulationRef.current = simulation;

    // --- Zoom ---
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent(zoomExtent)
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        containerSel.attr('transform', event.transform.toString());
      });

    svgSel.call(zoom);
    zoomRef.current = zoom;

    // --- Drag handlers ---
    function dragstarted(event: d3.D3DragEvent<SVGPathElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGPathElement, GraphNode, GraphNode>, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGPathElement, GraphNode, GraphNode>, d: GraphNode) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Expose drag behavior on the simulation for the component to attach
    (simulation as d3.Simulation<GraphNode, GraphEdge> & {
      dragBehavior: d3.DragBehavior<SVGPathElement, GraphNode, GraphNode | d3.SubjectPosition>;
    }).dragBehavior = d3
      .drag<SVGPathElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);

    // --- Responsive resize ---
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          width = w;
          height = h;
          simulation.force('center', d3.forceCenter(w / 2, h / 2));
          simulation.force('x', d3.forceX<GraphNode>(w / 2).strength(centeringStrength));
          simulation.force('y', d3.forceY<GraphNode>(h / 2).strength(centeringStrength));
          simulation.alpha(0.3).restart();
        }
      }
    });

    if (parentEl) {
      observer.observe(parentEl);
    }
    resizeObserverRef.current = observer;

    // --- Cleanup ---
    return () => {
      simulation.stop();
      simulationRef.current = null;
      observer.disconnect();
      resizeObserverRef.current = null;
      svgSel.on('.zoom', null);
    };
    // We intentionally depend on nodes/edges array identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, chargeStrength, linkDistance, centeringStrength, nodeSize, zoomExtent, svgRef, containerRef]);

  return {
    simulation: simulationRef,
    zoomBehavior: zoomRef,
    resetZoom,
  };
}
