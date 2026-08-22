import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ThreatsPanel from '../ThreatsPanel';

const makeThreat = (overrides: Record<string, unknown> = {}) => ({
  threat_id: 'threat-1',
  title: 'SQL Injection',
  stride_category: 'tampering',
  severity: 'high',
  likelihood: 'likely',
  risk_score: 8.5,
  attack_vector: 'Network',
  description: 'SQL injection via unvalidated input',
  remediation: 'Use parameterized queries',
  confidence: 0.92,
  cwe_ids: ['CWE-89'],
  capec_ids: ['CAPEC-66'],
  attack_technique_ids: ['T1190'],
  affected_assets: ['web-server'],
  ...overrides,
});

describe('ThreatsPanel', () => {
  it('renders threats grouped by STRIDE category', () => {
    const threats = [
      makeThreat({ threat_id: 't1', stride_category: 'spoofing', title: 'Spoofing Attack' }),
      makeThreat({ threat_id: 't2', stride_category: 'tampering', title: 'Tampering Attack' }),
      makeThreat({ threat_id: 't3', stride_category: 'spoofing', title: 'Another Spoofing' }),
    ];

    render(<ThreatsPanel threats={threats} />);

    expect(screen.getByText('Spoofing')).toBeInTheDocument();
    expect(screen.getByText('Tampering')).toBeInTheDocument();
    expect(screen.getByText('Spoofing Attack')).toBeInTheDocument();
    expect(screen.getByText('Another Spoofing')).toBeInTheDocument();
    expect(screen.getByText('Tampering Attack')).toBeInTheDocument();
  });

  it('shows severity badges', () => {
    const threats = [makeThreat({ severity: 'critical' })];

    render(<ThreatsPanel threats={threats} />);

    const badge = screen.getByText('critical');
    expect(badge).toBeInTheDocument();
    // Check the badge has the expected background color style
    expect(badge.style.backgroundColor).toBe('rgb(220, 38, 38)');
  });

  it('displays risk scores', () => {
    const threats = [makeThreat({ risk_score: 9.1 })];

    render(<ThreatsPanel threats={threats} />);

    expect(screen.getByText('Risk: 9.1')).toBeInTheDocument();
  });

  it('shows "No threats found" when empty array passed', () => {
    render(<ThreatsPanel threats={[]} />);

    expect(
      screen.getByText(/No threats found/),
    ).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ThreatsPanel threats={[]} loading={true} />);

    expect(screen.getByText('Loading threats...')).toBeInTheDocument();
  });

  it('shows expandable cards with remediation details', () => {
    const threats = [makeThreat()];

    render(<ThreatsPanel threats={threats} />);

    // Remediation should not be visible before expanding
    expect(screen.queryByText('Use parameterized queries')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('SQL Injection'));

    // Now remediation should be visible
    expect(screen.getByText('Use parameterized queries')).toBeInTheDocument();
    expect(screen.getByText('Remediation')).toBeInTheDocument();
    expect(screen.getByText('SQL injection via unvalidated input')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('displays CWE IDs in expanded view', () => {
    const threats = [makeThreat({ cwe_ids: ['CWE-89', 'CWE-79'] })];

    render(<ThreatsPanel threats={threats} />);

    // Expand the card
    fireEvent.click(screen.getByText('SQL Injection'));

    expect(screen.getByText('CWE-89')).toBeInTheDocument();
    expect(screen.getByText('CWE-79')).toBeInTheDocument();
    expect(screen.getByText('CWE References')).toBeInTheDocument();
  });

  it('displays ATT&CK technique IDs in expanded view', () => {
    const threats = [makeThreat({ attack_technique_ids: ['T1190', 'T1059'] })];

    render(<ThreatsPanel threats={threats} />);

    fireEvent.click(screen.getByText('SQL Injection'));

    expect(screen.getByText('T1190')).toBeInTheDocument();
    expect(screen.getByText('T1059')).toBeInTheDocument();
  });

  it('displays affected assets in expanded view', () => {
    const threats = [makeThreat({ affected_assets: ['web-server', 'db-server'] })];

    render(<ThreatsPanel threats={threats} />);

    fireEvent.click(screen.getByText('SQL Injection'));

    expect(screen.getByText('web-server')).toBeInTheDocument();
    expect(screen.getByText('db-server')).toBeInTheDocument();
    expect(screen.getByText('Affected Assets')).toBeInTheDocument();
  });

  it('displays confidence percentage', () => {
    const threats = [makeThreat({ confidence: 0.85 })];

    render(<ThreatsPanel threats={threats} />);

    fireEvent.click(screen.getByText('SQL Injection'));

    expect(screen.getByText('Confidence: 85%')).toBeInTheDocument();
  });

  it('shows category count badges', () => {
    const threats = [
      makeThreat({ threat_id: 't1', stride_category: 'spoofing', title: 'Attack 1' }),
      makeThreat({ threat_id: 't2', stride_category: 'spoofing', title: 'Attack 2' }),
    ];

    render(<ThreatsPanel threats={threats} />);

    // The count badge should show "2" for the spoofing category
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('can collapse an expanded card', () => {
    const threats = [makeThreat()];

    render(<ThreatsPanel threats={threats} />);

    // Expand
    fireEvent.click(screen.getByText('SQL Injection'));
    expect(screen.getByText('Use parameterized queries')).toBeInTheDocument();

    // Collapse
    fireEvent.click(screen.getByText('SQL Injection'));
    expect(screen.queryByText('Use parameterized queries')).not.toBeInTheDocument();
  });
});
