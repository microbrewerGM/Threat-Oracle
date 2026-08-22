/**
 * graphHelpers.test.ts — Unit tests for pure graph helper functions.
 */

import { describe, it, expect } from 'vitest';
import {
  nodeShapePath,
  nodeCollisionRadius,
  NODE_TYPE_COLORS,
  STRIDE_COLORS,
  SEVERITY_COLORS,
  generateGlowFilterId,
  STRIDE_CATEGORY_TO_STORE_KEY,
  createRiskRadiusScale,
  createRiskColorScale,
} from '@/components/graph/graphHelpers';

// ---------------------------------------------------------------------------
// nodeShapePath
// ---------------------------------------------------------------------------

describe('nodeShapePath', () => {
  const types = [
    'api',
    'application',
    'database',
    'service',
    'server',
    'container',
    'network_device',
    'other',
    'unknown_type',
  ];

  it.each(types)('returns a string for type "%s"', (type) => {
    expect(typeof nodeShapePath(type)).toBe('string');
  });

  it.each(types)('path for "%s" starts with M (valid SVG move-to)', (type) => {
    expect(nodeShapePath(type)).toMatch(/^M /);
  });

  it.each(types)('path for "%s" contains Z (closed path)', (type) => {
    expect(nodeShapePath(type)).toContain('Z');
  });

  it('api and application return the same path (both roundedRect)', () => {
    expect(nodeShapePath('api')).toBe(nodeShapePath('application'));
  });

  it('custom size produces a different path than default', () => {
    expect(nodeShapePath('server', 24)).not.toBe(nodeShapePath('server', 18));
  });

  it('works without a second argument (default size)', () => {
    expect(nodeShapePath('server')).toBe(nodeShapePath('server', 18));
  });
});

// ---------------------------------------------------------------------------
// nodeCollisionRadius
// ---------------------------------------------------------------------------

describe('nodeCollisionRadius', () => {
  const types = [
    'api',
    'application',
    'database',
    'service',
    'server',
    'container',
    'network_device',
    'other',
  ];

  it.each(types)('returns a positive number for type "%s"', (type) => {
    const r = nodeCollisionRadius(type);
    expect(typeof r).toBe('number');
    expect(r).toBeGreaterThan(0);
  });

  it('larger size yields larger collision radius', () => {
    expect(nodeCollisionRadius('api', 24)).toBeGreaterThan(
      nodeCollisionRadius('api', 18),
    );
  });
});

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

describe('NODE_TYPE_COLORS', () => {
  const expectedKeys = [
    'api',
    'application',
    'database',
    'server',
    'service',
    'container',
    'network_device',
    'other',
  ];

  it.each(expectedKeys)('has key "%s"', (key) => {
    expect(NODE_TYPE_COLORS).toHaveProperty(key);
  });

  it('all values are valid hex colors', () => {
    for (const color of Object.values(NODE_TYPE_COLORS)) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('STRIDE_COLORS', () => {
  const expectedKeys = [
    'spoofing',
    'tampering',
    'repudiation',
    'information_disclosure',
    'denial_of_service',
    'elevation_of_privilege',
  ];

  it.each(expectedKeys)('has key "%s"', (key) => {
    expect(STRIDE_COLORS).toHaveProperty(key);
  });
});

describe('SEVERITY_COLORS', () => {
  const expectedKeys = ['critical', 'high', 'medium', 'low', 'info'];

  it.each(expectedKeys)('has key "%s"', (key) => {
    expect(SEVERITY_COLORS).toHaveProperty(key);
  });
});

// ---------------------------------------------------------------------------
// generateGlowFilterId
// ---------------------------------------------------------------------------

describe('generateGlowFilterId', () => {
  it('returns glow-spoofing for "spoofing"', () => {
    expect(generateGlowFilterId('spoofing')).toBe('glow-spoofing');
  });

  it('replaces underscores with hyphens for information_disclosure', () => {
    expect(generateGlowFilterId('information_disclosure')).toBe(
      'glow-information-disclosure',
    );
  });

  it('replaces underscores with hyphens for denial_of_service', () => {
    expect(generateGlowFilterId('denial_of_service')).toBe(
      'glow-denial-of-service',
    );
  });
});

// ---------------------------------------------------------------------------
// STRIDE_CATEGORY_TO_STORE_KEY
// ---------------------------------------------------------------------------

describe('STRIDE_CATEGORY_TO_STORE_KEY', () => {
  it('maps all 6 API categories', () => {
    expect(Object.keys(STRIDE_CATEGORY_TO_STORE_KEY)).toHaveLength(6);
  });

  it('information_disclosure maps to informationDisclosure', () => {
    expect(STRIDE_CATEGORY_TO_STORE_KEY['information_disclosure']).toBe(
      'informationDisclosure',
    );
  });
});

// ---------------------------------------------------------------------------
// createRiskRadiusScale
// ---------------------------------------------------------------------------

describe('createRiskRadiusScale', () => {
  it('returns a function', () => {
    expect(typeof createRiskRadiusScale()).toBe('function');
  });

  it('scale(0) returns 10', () => {
    expect(createRiskRadiusScale()(0)).toBe(10);
  });

  it('scale(10) returns 30', () => {
    expect(createRiskRadiusScale()(10)).toBe(30);
  });

  it('scale(5) returns a value between 10 and 30', () => {
    const v = createRiskRadiusScale()(5);
    expect(v).toBeGreaterThan(10);
    expect(v).toBeLessThan(30);
  });
});

// ---------------------------------------------------------------------------
// createRiskColorScale
// ---------------------------------------------------------------------------

describe('createRiskColorScale', () => {
  it('returns a function', () => {
    expect(typeof createRiskColorScale()).toBe('function');
  });

  it('scale(0) returns a color string', () => {
    const c = createRiskColorScale()(0);
    expect(c).toBeTruthy();
    expect(c).toMatch(/^(rgb|#)/);
  });

  it('scale(10) returns a color string', () => {
    const c = createRiskColorScale()(10);
    expect(c).toBeTruthy();
    expect(c).toMatch(/^(rgb|#)/);
  });

  it('scale(5) returns a color string', () => {
    const c = createRiskColorScale()(5);
    expect(c).toBeTruthy();
    expect(c).toMatch(/^(rgb|#)/);
  });
});
