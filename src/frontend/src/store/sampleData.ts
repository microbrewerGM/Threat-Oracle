// Sample data for demonstration purposes

export interface TechnicalAsset {
  id: string;
  name: string;
  description?: string;
  type: 'server' | 'application' | 'database' | 'container' | 'api' | 'service' | 'network_device' | 'other';
  owner?: string;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  technology_stack?: string[];
  version?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TrustBoundary {
  id: string;
  name: string;
  description?: string;
  type: 'network_segment' | 'security_zone' | 'organizational_boundary' | 'physical_boundary' | 'other';
  security_level?: 'public' | 'dmz' | 'internal' | 'restricted' | 'highly_restricted';
  owner?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DataFlow {
  id: string;
  name?: string;
  description?: string;
  source_id: string;
  target_id: string;
  protocol: 'http' | 'https' | 'tcp' | 'udp' | 'ssh' | 'ftp' | 'sftp' | 'smtp' | 'sql' | 'other';
  port?: number;
  is_encrypted?: boolean;
  authentication_method?: 'none' | 'basic' | 'token' | 'certificate' | 'oauth' | 'other';
  data_assets?: string[];
  crosses_trust_boundary?: boolean;
  trust_boundary_id?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

// Sample technical assets
export const technicalAssets: TechnicalAsset[] = [
  {
    id: 'ta-001',
    name: 'Web Server',
    description: 'Main web server hosting the application',
    type: 'server',
    owner: 'Infrastructure Team',
    criticality: 'high',
    technology_stack: ['Nginx', 'Ubuntu 20.04'],
    version: '1.0.0',
    tags: ['frontend', 'public-facing']
  },
  {
    id: 'ta-002',
    name: 'Application Server',
    description: 'Application logic server',
    type: 'application',
    owner: 'Development Team',
    criticality: 'high',
    technology_stack: ['Node.js', 'Express'],
    version: '2.1.0',
    tags: ['backend', 'api']
  },
  {
    id: 'ta-003',
    name: 'Database Server',
    description: 'Primary database server',
    type: 'database',
    owner: 'Database Team',
    criticality: 'critical',
    technology_stack: ['PostgreSQL', 'Ubuntu 20.04'],
    version: '13.2',
    tags: ['data', 'persistent']
  },
  {
    id: 'ta-004',
    name: 'Authentication Service',
    description: 'Handles user authentication and authorization',
    type: 'service',
    owner: 'Security Team',
    criticality: 'critical',
    technology_stack: ['Java', 'Spring Boot'],
    version: '1.5.0',
    tags: ['security', 'auth']
  }
];

// Sample trust boundaries
export const trustBoundaries: TrustBoundary[] = [
  {
    id: 'tb-001',
    name: 'Public DMZ',
    description: 'Demilitarized zone for public-facing services',
    type: 'network_segment',
    security_level: 'dmz',
    owner: 'Network Team',
    tags: ['external', 'public']
  },
  {
    id: 'tb-002',
    name: 'Internal Network',
    description: 'Internal corporate network',
    type: 'network_segment',
    security_level: 'internal',
    owner: 'Network Team',
    tags: ['internal']
  },
  {
    id: 'tb-003',
    name: 'Database Zone',
    description: 'Restricted zone for database servers',
    type: 'security_zone',
    security_level: 'restricted',
    owner: 'Database Team',
    tags: ['data', 'restricted']
  }
];

// Sample data flows
export const dataFlows: DataFlow[] = [
  {
    id: 'df-001',
    name: 'Web to App Traffic',
    description: 'HTTP traffic from web server to application server',
    source_id: 'ta-001',
    target_id: 'ta-002',
    protocol: 'https',
    port: 443,
    is_encrypted: true,
    authentication_method: 'token',
    crosses_trust_boundary: true,
    trust_boundary_id: 'tb-001',
    tags: ['api', 'encrypted']
  },
  {
    id: 'df-002',
    name: 'App to DB Traffic',
    description: 'Database queries from application to database',
    source_id: 'ta-002',
    target_id: 'ta-003',
    protocol: 'tcp',
    port: 5432,
    is_encrypted: true,
    authentication_method: 'certificate',
    crosses_trust_boundary: true,
    trust_boundary_id: 'tb-003',
    tags: ['data', 'encrypted']
  },
  {
    id: 'df-003',
    name: 'Auth Traffic',
    description: 'Authentication requests to auth service',
    source_id: 'ta-002',
    target_id: 'ta-004',
    protocol: 'https',
    port: 8443,
    is_encrypted: true,
    authentication_method: 'certificate',
    crosses_trust_boundary: false,
    tags: ['auth', 'encrypted']
  }
];

// Helper function to get all nodes for graph visualization
export const getGraphNodes = () => {
  return [
    ...technicalAssets.map(asset => ({
      id: asset.id,
      name: asset.name,
      type: asset.type
    }))
  ];
};

// Helper function to get all edges for graph visualization
export const getGraphEdges = () => {
  return dataFlows.map(flow => ({
    id: flow.id,
    source: flow.source_id,
    target: flow.target_id,
    label: flow.protocol.toUpperCase()
  }));
};
