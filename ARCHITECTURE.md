# Threat Oracle Architecture

This document outlines the architecture, design principles, and deployment strategies for Threat Oracle. It serves as a guide for developers and provides a mapping between features and architectural components.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Principles](#architecture-principles)
- [Component Architecture](#component-architecture)
- [Data Architecture](#data-architecture)
- [Feature-to-Architecture Mapping](#feature-to-architecture-mapping)
- [Deployment Strategies](#deployment-strategies)
- [Security Considerations](#security-considerations)
- [Performance Considerations](#performance-considerations)
- [Monitoring and Observability](#monitoring-and-observability)

## System Overview

Threat Oracle is a visual threat modeling tool that creates digital twins of applications and infrastructure using a graph-based approach. The system consists of several key components:

1. **Frontend Application**: A React-based web application that provides the user interface for creating, visualizing, and analyzing threat models.
2. **Backend API**: A FastAPI-based service that handles business logic, data processing, and integration with databases.
3. **Graph Database**: A Neo4j or compatible graph database that stores the digital twin models.
4. **Schema Service**: A service that manages and validates the schema for the digital twin models.
5. **Visualization Engine**: A component that renders the graph visualizations using D3.js or a similar library.
6. **Analysis Engine**: A component that applies threat and risk rules to the digital twin models.

## Architecture Principles

### 1. Microservices Architecture

Threat Oracle follows a microservices architecture to enable:
- Independent development and deployment of components
- Technology flexibility for different components
- Scalability of individual services based on demand
- Resilience through service isolation

### 2. API-First Design

All services expose well-defined APIs:
- RESTful APIs for synchronous operations
- GraphQL for complex data queries
- Event-driven APIs for asynchronous operations

### 3. Domain-Driven Design

The system is organized around business domains:
- Schema management
- Model creation and editing
- Visualization
- Analysis and reporting

### 4. Cloud-Native Design

The architecture embraces cloud-native principles:
- Containerization of all components
- Stateless services where possible
- Externalized configuration
- Designed for horizontal scaling

### 5. DevOps Integration

The architecture supports DevOps practices:
- Infrastructure as Code (IaC)
- Continuous Integration/Continuous Deployment (CI/CD)
- Automated testing at all levels
- Monitoring and observability built-in

## Component Architecture

### Frontend Architecture

The frontend follows a modern React architecture:

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components
│   │   ├── graph/       # Graph visualization components
│   │   ├── model/       # Model editing components
│   │   └── analysis/    # Analysis and reporting components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API client services
│   ├── store/           # State management (Zustand)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main application component
│   └── index.tsx        # Entry point
├── tests/               # Frontend tests
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
└── package.json         # Dependencies and scripts
```

**Key Technologies**:
- React for UI components
- TypeScript for type safety
- Zustand for state management
- D3.js for graph visualization
- Vite for build tooling
- Vitest for testing

### Backend Architecture

The backend follows a modular, domain-driven architecture:

```
backend/
├── api/                 # API layer
│   ├── routes/          # API route definitions
│   ├── middleware/      # API middleware
│   └── controllers/     # Request handlers
├── core/                # Core business logic
│   ├── services/        # Business services
│   ├── models/          # Domain models
│   └── interfaces/      # Service interfaces
├── infrastructure/      # External integrations
│   ├── database/        # Database access
│   ├── messaging/       # Message queue integration
│   └── external/        # External API clients
├── utils/               # Utility functions
├── config/              # Configuration
├── tests/               # Backend tests
│   ├── unit/            # Unit tests
│   ├── integration/     # Integration tests
│   └── e2e/             # End-to-end tests
└── main.py              # Application entry point
```

**Key Technologies**:
- FastAPI for API framework
- Pydantic for data validation
- SQLAlchemy for ORM (when needed)
- Neo4j Python driver for graph database access
- Pytest for testing
- Alembic for database migrations

### Schema Service Architecture

The schema service manages the digital twin schema:

```
schema/
├── definitions/         # Schema definitions
│   ├── nodes/           # Node type definitions
│   ├── edges/           # Edge type definitions
│   └── properties/      # Property definitions
├── validation/          # Schema validation logic
├── versioning/          # Schema versioning
└── api/                 # Schema service API
```

**Key Technologies**:
- JSON Schema for schema definition
- FastAPI for API endpoints
- Pydantic for validation

## Data Architecture

### Graph Data Model

The core of Threat Oracle is its graph data model:

1. **Nodes** represent entities such as:
   - Technical Assets (servers, applications, databases)
   - Trust Boundaries (network segments, security zones)
   - Data Assets (information types)
   - Actors/Personas (users, roles, external entities)
   - Security Controls (safeguards, countermeasures)

2. **Edges** represent relationships such as:
   - Data Flows (how data moves between assets)
   - Access Relationships (how actors interact with assets)
   - Trust Relationships (how entities cross boundaries)
   - Dependency Relationships (how assets depend on each other)
   - Protection Relationships (how controls protect assets)

### Database Strategy

Threat Oracle supports multiple database backends:

1. **Primary: Neo4j**
   - Native graph database
   - Powerful query language (Cypher)
   - Visualization capabilities (Neo4j Bloom)

2. **Alternative: Amazon Neptune**
   - Fully managed graph database service
   - High availability and durability
   - Integration with AWS services

3. **Development: SQLite with Graph Extensions**
   - Lightweight option for local development
   - No external dependencies
   - Limited scalability

### Data Access Patterns

The system uses different data access patterns for different operations:

1. **CRUD Operations**: REST API for basic create, read, update, delete
2. **Complex Queries**: GraphQL for flexible, client-driven queries
3. **Bulk Operations**: Batch APIs for large-scale operations
4. **Real-time Updates**: WebSockets for live updates to the UI

## Feature-to-Architecture Mapping

This section maps the key features of Threat Oracle to the architectural components that implement them.

### 1. Digital Twin Creation

**Components Involved**:
- Frontend Model Editor
- Backend API (Model Management)
- Schema Service
- Graph Database

**Implementation Strategy**:
- User creates nodes and edges through the UI
- Frontend validates basic input
- Backend validates against schema
- Data is stored in the graph database
- Real-time feedback is provided to the user

### 2. Graph Data Structure

**Components Involved**:
- Schema Service
- Graph Database
- Backend API (Graph Management)

**Implementation Strategy**:
- Schema defines valid node and edge types
- Graph database stores the structure
- API provides CRUD operations for graph elements
- Validation ensures graph integrity

### 3. Visualization

**Components Involved**:
- Frontend Visualization Engine
- Backend API (Graph Query)
- Graph Database

**Implementation Strategy**:
- Backend queries graph data
- Frontend renders using D3.js
- Interactive elements allow exploration
- Layout algorithms optimize visualization
- Filtering and highlighting enhance usability

### 4. Threat and Risk Analysis

**Components Involved**:
- Analysis Engine
- Backend API (Analysis)
- Graph Database
- Frontend Reporting Components

**Implementation Strategy**:
- Analysis rules are defined in the backend
- Rules are applied to the graph model
- Results are stored and associated with the model
- Frontend displays findings and recommendations
- Interactive exploration of issues is supported

## Deployment Strategies

Threat Oracle supports multiple deployment models to accommodate different environments and scales.

### Local Development Environment

**Architecture**:
- Frontend and backend run as separate processes
- Local Neo4j instance or SQLite with graph extensions
- Hot reloading for rapid development
- Local mocks for external dependencies

**Implementation**:
- Docker Compose for local service orchestration
- npm/yarn for frontend development
- Python virtual environment for backend
- Local configuration overrides

### Containerized Deployment

**Architecture**:
- All components packaged as Docker containers
- Container orchestration with Docker Compose
- Shared volumes for persistence
- Network isolation between components

**Implementation**:
- Multi-stage Docker builds for efficient images
- Docker Compose for service definition
- Volume mounts for data persistence
- Environment variables for configuration

### Kubernetes Deployment

**Architecture**:
- Microservices deployed as Kubernetes pods
- Horizontal scaling for stateless components
- StatefulSets for stateful components
- Ingress controllers for external access
- ConfigMaps and Secrets for configuration

**Implementation**:
- Helm charts for deployment management
- Kubernetes manifests for resource definition
- Horizontal Pod Autoscalers for scaling
- Persistent Volume Claims for storage
- Service meshes for advanced networking (optional)

### Cloud-Native Deployment

**Architecture**:
- Managed services where appropriate
- Serverless components for suitable workloads
- Cloud provider integrations
- Multi-region for high availability

**Implementation Options**:
- AWS: EKS, Neptune, Lambda, S3, CloudFront
- Azure: AKS, Cosmos DB, Functions, Blob Storage, CDN
- GCP: GKE, Cloud Spanner, Cloud Functions, Cloud Storage, Cloud CDN

## Security Considerations

### Authentication and Authorization

- OAuth 2.0 / OpenID Connect for authentication
- Role-Based Access Control (RBAC) for authorization
- JWT tokens for API authentication
- Secure session management
- Multi-factor authentication support

### Data Protection

- Encryption at rest for all data stores
- Encryption in transit (TLS/SSL)
- Data masking for sensitive information
- Secure handling of credentials and secrets
- Regular security audits and penetration testing

### API Security

- Rate limiting to prevent abuse
- Input validation and sanitization
- Protection against common attacks (OWASP Top 10)
- API versioning for backward compatibility
- Comprehensive logging for security events

## Performance Considerations

### Frontend Performance

- Code splitting for faster initial load
- Lazy loading of components
- Efficient rendering of large graphs
- Client-side caching of data
- Progressive loading of large datasets

### Backend Performance

- Database query optimization
- Caching strategies (Redis, in-memory)
- Asynchronous processing for long-running tasks
- Pagination for large result sets
- Resource pooling (connection pools, thread pools)

### Database Performance

- Indexing strategies for graph databases
- Query optimization for complex graph traversals
- Caching frequently accessed data
- Partitioning strategies for large graphs
- Read replicas for scaling read operations

## Monitoring and Observability

### Logging

- Structured logging format (JSON)
- Centralized log collection
- Log levels for different environments
- Correlation IDs for request tracing
- Sensitive data filtering

### Metrics

- Application metrics (response times, error rates)
- Business metrics (models created, analyses run)
- System metrics (CPU, memory, disk, network)
- Custom metrics for key performance indicators
- Prometheus integration for metrics collection

### Tracing

- Distributed tracing across services
- OpenTelemetry integration
- Trace sampling for high-volume systems
- Visualization of request flows
- Performance bottleneck identification

### Alerting

- Alert definitions for critical conditions
- Multiple notification channels
- Alert aggregation to prevent alert fatigue
- Runbooks for common issues
- On-call rotation support

---

This architecture document will evolve as the project progresses. Regular reviews and updates will ensure it remains aligned with the project's goals and the evolving technology landscape.
