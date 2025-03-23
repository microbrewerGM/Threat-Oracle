import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './SimpleGraph.css';

interface Node {
  id: string;
  name: string;
  type: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface SimpleGraphProps {
  nodes: Node[];
  edges: Edge[];
  width?: number;
  height?: number;
}

const SimpleGraph: React.FC<SimpleGraphProps> = ({
  nodes,
  edges,
  width = 800,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove();

    // Create the simulation
    const simulation = d3
      .forceSimulation()
      .nodes(nodes as d3.SimulationNodeDatum[])
      .force(
        'link',
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Create the SVG container
    const svg = d3.select(svgRef.current);

    // Create the edges
    const link = svg
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'link');

    // Create edge labels
    const edgeLabels = svg
      .append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .attr('class', 'edge-label')
      .text((d) => d.label);

    // Create the nodes
    const node = svg
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', (d) => `node node-${d.type}`)
      .attr('r', 10)
      .call(
        d3
          .drag<SVGCircleElement, any>()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended) as any
      );

    // Create node labels
    const nodeLabels = svg
      .append('g')
      .attr('class', 'node-labels')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .text((d) => d.name);

    // Add tooltips
    node.append('title').text((d) => d.name);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      nodeLabels
        .attr('x', (d: any) => d.x + 15)
        .attr('y', (d: any) => d.y + 5);

      edgeLabels
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height]);

  return (
    <div className="simple-graph-container">
      <svg ref={svgRef} width={width} height={height} className="simple-graph" />
    </div>
  );
};

export default SimpleGraph;
