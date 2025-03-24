import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import './SimpleGraph.css';
import AssetDetailPopup from './AssetDetailPopup';
import EdgeDetailPopup from './EdgeDetailPopup';

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
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Determine asset type based on node type
  const getAssetType = (nodeType: string): 'technical' | 'data' | 'trust' => {
    if (nodeType.includes('server') || 
        nodeType.includes('application') || 
        nodeType.includes('database') || 
        nodeType.includes('container') || 
        nodeType.includes('api') || 
        nodeType.includes('service') || 
        nodeType.includes('network_device')) {
      return 'technical';
    } else if (nodeType.includes('network_segment') || 
               nodeType.includes('security_zone') || 
               nodeType.includes('organizational_boundary') || 
               nodeType.includes('physical_boundary')) {
      return 'trust';
    } else {
      return 'technical'; // Default to technical for now
    }
  };
  
  const handleNodeClick = (event: MouseEvent, node: Node) => {
    event.stopPropagation();
    setSelectedEdge(null);
    setSelectedNode(node);
    setPopupPosition({ x: event.clientX, y: event.clientY });
  };
  
  const handleEdgeClick = (event: MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setSelectedNode(null);
    setSelectedEdge(edge);
    setPopupPosition({ x: event.clientX, y: event.clientY });
  };
  
  const handleClosePopup = () => {
    setSelectedNode(null);
    setSelectedEdge(null);
    setPopupPosition(null);
  };
  
  const handleNodeDrillDown = () => {
    if (selectedNode) {
      // Navigate to the appropriate page based on the node type
      const assetType = getAssetType(selectedNode.type);
      
      switch (assetType) {
        case 'technical':
          navigate(`/technical-assets?id=${selectedNode.id}`);
          break;
        case 'data':
          navigate(`/data-assets?id=${selectedNode.id}`);
          break;
        case 'trust':
          navigate(`/trust-boundaries?id=${selectedNode.id}`);
          break;
      }
      
      // Close the popup
      handleClosePopup();
    }
  };
  
  const handleEdgeDrillDown = () => {
    if (selectedEdge) {
      navigate(`/data-flows?id=${selectedEdge.id}`);
      handleClosePopup();
    }
  };

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
      .attr('class', 'link')
      .on('click', function(event, d) {
        handleEdgeClick(event, d);
      });

    // Create edge labels
    const edgeLabels = svg
      .append('g')
      .attr('class', 'edge-labels')
      .selectAll('text')
      .data(edges)
      .enter()
      .append('text')
      .attr('class', 'edge-label')
      .text((d) => d.label)
      .on('click', function(event, d) {
        handleEdgeClick(event, d);
      });

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
      .on('click', function(event, d) {
        handleNodeClick(event, d);
      })
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
      
      {selectedNode && popupPosition && (
        <AssetDetailPopup
          assetId={selectedNode.id}
          assetType={getAssetType(selectedNode.type)}
          position={popupPosition}
          onClose={handleClosePopup}
          onDrillDown={handleNodeDrillDown}
        />
      )}
      
      {selectedEdge && popupPosition && (
        <EdgeDetailPopup
          edgeId={selectedEdge.id}
          position={popupPosition}
          onClose={handleClosePopup}
          onDrillDown={handleEdgeDrillDown}
        />
      )}
    </div>
  );
};

export default SimpleGraph;
