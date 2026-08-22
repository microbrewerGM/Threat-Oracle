/**
 * graphHelpers.ts — Pure utility functions for the ThreatGraph visualization.
 *
 * Contains node shape path generators and color maps used by D3 rendering.
 * All functions are side-effect free and operate on primitive inputs.
 */

import * as d3 from 'd3';

// ---------------------------------------------------------------------------
// Node shape SVG path generators
// Each returns a `d` attribute string centered at (0, 0).
// ---------------------------------------------------------------------------

/**
 * Rounded rectangle path (used for api, application).
 * @param w  half-width
 * @param h  half-height
 * @param r  corner radius
 */
function roundedRect(w: number, h: number, r: number): string {
  return (
    `M ${-w + r},${-h}` +
    ` H ${w - r}` +
    ` Q ${w},${-h} ${w},${-h + r}` +
    ` V ${h - r}` +
    ` Q ${w},${h} ${w - r},${h}` +
    ` H ${-w + r}` +
    ` Q ${-w},${h} ${-w},${h - r}` +
    ` V ${-h + r}` +
    ` Q ${-w},${-h} ${-w + r},${-h}` +
    ` Z`
  );
}

/**
 * Cylinder path (used for database).
 * Draws a top ellipse, sides, and bottom arc.
 */
function cylinder(w: number, h: number, ry: number): string {
  // Top ellipse
  const top =
    `M ${-w},${-h + ry}` +
    ` A ${w},${ry} 0 1,1 ${w},${-h + ry}` +
    ` A ${w},${ry} 0 1,1 ${-w},${-h + ry}`;
  // Body + bottom arc
  const body =
    `M ${-w},${-h + ry}` +
    ` V ${h - ry}` +
    ` A ${w},${ry} 0 0,0 ${w},${h - ry}` +
    ` V ${-h + ry}`;
  return `${top} ${body} Z`;
}

/**
 * Hexagon path (used for service).
 */
function hexagon(size: number): string {
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push([size * Math.cos(angle), size * Math.sin(angle)]);
  }
  return (
    `M ${points[0][0]},${points[0][1]}` +
    points
      .slice(1)
      .map(([x, y]) => ` L ${x},${y}`)
      .join('') +
    ' Z'
  );
}

/**
 * Plain rectangle path (used for server).
 */
function rect(w: number, h: number): string {
  return `M ${-w},${-h} H ${w} V ${h} H ${-w} Z`;
}

/**
 * Circle path (default fallback).
 */
function circlePath(r: number): string {
  return (
    `M 0,${-r}` +
    ` A ${r},${r} 0 1,1 0,${r}` +
    ` A ${r},${r} 0 1,1 0,${-r}` +
    ` Z`
  );
}

/**
 * Returns an SVG path `d` attribute string for the given asset type,
 * centered at the origin (0, 0).
 *
 * @param type  TechnicalAsset type string
 * @param size  Base size unit (default 18)
 */
export function nodeShapePath(type: string, size: number = 18): string {
  switch (type) {
    case 'api':
    case 'application':
      return roundedRect(size * 1.2, size * 0.8, size * 0.25);
    case 'database':
      return cylinder(size * 0.9, size * 1.1, size * 0.35);
    case 'service':
      return hexagon(size);
    case 'server':
      return rect(size * 1.1, size * 0.85);
    case 'container':
      return roundedRect(size, size, size * 0.15);
    case 'network_device':
      return hexagon(size * 0.9);
    default:
      return circlePath(size);
  }
}

/**
 * Returns the approximate collision radius for a given node type and size,
 * so D3 forceCollide can prevent overlaps.
 */
export function nodeCollisionRadius(type: string, size: number = 18): number {
  switch (type) {
    case 'api':
    case 'application':
      return size * 1.2 + 4;
    case 'database':
      return size * 1.1 + 4;
    case 'service':
    case 'network_device':
      return size + 4;
    case 'server':
      return size * 1.1 + 4;
    case 'container':
      return size + 4;
    default:
      return size + 4;
  }
}

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

/** Colors per technical asset type — used for node fill. */
export const NODE_TYPE_COLORS: Record<string, string> = {
  api: '#00DFFF',
  application: '#00DFFF',
  database: '#22FF88',
  server: '#748FFC',
  service: '#FFA94D',
  container: '#76b7b2',
  network_device: '#DA77F2',
  other: '#8B949E',
};

/** STRIDE threat category colors (Phase 3). */
export const STRIDE_COLORS: Record<string, string> = {
  spoofing: '#FF6B6B',
  tampering: '#FFA94D',
  repudiation: '#FFD43B',
  information_disclosure: '#69DB7C',
  denial_of_service: '#748FFC',
  elevation_of_privilege: '#DA77F2',
};

/** Severity level colors (Phase 3). */
export const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF4444',
  high: '#FF8C00',
  medium: '#FFD700',
  low: '#4DA6FF',
  info: '#8B949E',
};

// ---------------------------------------------------------------------------
// Phase 3 — Threat overlay helpers
// ---------------------------------------------------------------------------

/** Generate an SVG filter ID for a STRIDE category glow effect. */
export function generateGlowFilterId(strideCategory: string): string {
  return `glow-${strideCategory.replace(/_/g, '-')}`;
}

/** Map from STRIDE snake_case (API) to graphLayerStore camelCase keys. */
export const STRIDE_CATEGORY_TO_STORE_KEY: Record<string, string> = {
  spoofing: 'spoofing',
  tampering: 'tampering',
  repudiation: 'repudiation',
  information_disclosure: 'informationDisclosure',
  denial_of_service: 'denialOfService',
  elevation_of_privilege: 'elevationOfPrivilege',
};

/** Risk score -> circle radius (sqrt scale for area perception). */
export function createRiskRadiusScale(): d3.ScalePower<number, number> {
  return d3.scaleSqrt().domain([0, 10]).range([10, 30]);
}

/** Risk score -> color (green -> yellow -> red). */
export function createRiskColorScale(): d3.ScaleLinear<string, string> {
  return d3.scaleLinear<string>().domain([0, 5, 10]).range(['#69DB7C', '#FFD43B', '#FF4444']);
}
