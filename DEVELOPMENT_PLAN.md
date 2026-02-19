# Threat Oracle Development Plan

This document outlines the development approach for Threat Oracle, organized into phases with completed and upcoming work.

## Development Philosophy

1. **Start Small, Iterate Often**: Begin with the simplest working implementation, then iterate.
2. **Test-Driven Development**: Write tests before implementing features.
3. **API-First Design**: Design APIs before implementing them.
4. **Docker-First Development**: All tests and services run in Docker for consistency.
5. **Continuous Integration**: Automated testing on every push.

## Phase 0: Project Setup (Completed)

- [x] Project vision and documentation
- [x] Git repository and CI/CD pipeline
- [x] Linting (black, ruff, mypy, eslint, prettier, markdownlint)
- [x] Testing framework (pytest, vitest)
- [x] Docker development environment (docker-compose.dev.yml)
- [x] Pre-commit hooks

## Phase 1: Core Schema Definition (Completed)

- [x] Technical asset node schema and validation
- [x] Trust boundary node schema and validation
- [x] Data asset node schema and validation
- [x] Data flow (relationship) schema and validation
- [x] Schema validator module with test suite

## Phase 2: Security Knowledge Graph (Completed)

### 2.1: Neo4j AuraDB Integration (Completed)

- [x] AuraDB connection with environment-based credentials
- [x] Connection verification tests (4/4 passing)
- [x] Shared Neo4j driver module (`src/db.py`)

### 2.2: CWE Importer (Completed)

- [x] XML parser for CWE weakness definitions
- [x] Neo4j importer with MERGE-based idempotent writes
- [x] 969 CWE nodes, 1443+ relationships (ChildOf, PeerOf, etc.)
- [x] Tests: 10/10 passing

### 2.3: ATT&CK Importer (Completed)

- [x] STIX 2.1 JSON parser for enterprise ATT&CK
- [x] Imports Techniques, Tactics, Mitigations, Groups, Software, Campaigns, DataSources
- [x] 2290 nodes, 19K+ relationships (USES, MITIGATES, SUBTECHNIQUE_OF, etc.)
- [x] Tests: 12/12 passing

### 2.4: CAPEC Importer (Completed)

- [x] XML parser for CAPEC attack patterns
- [x] Bridges CWE weaknesses to ATT&CK techniques
- [x] EXPLOITS_WEAKNESS and MAPS_TO_TECHNIQUE relationships
- [x] Full chain: CWE → CAPEC → ATT&CK verified
- [x] Tests: 13/13 passing

## Phase 3: API Layer (In Progress)

### 3.1: FastAPI Backend (Completed)

- [x] FastAPI application factory with CORS middleware
- [x] Health check endpoints (basic + database)
- [x] Graph query endpoints (stats, list nodes, get node, search)
- [x] Import trigger endpoints (CWE, ATT&CK, CAPEC)
- [x] Neo4j session dependency injection
- [x] Pydantic settings from environment variables
- [x] Docker service for API (`docker compose up api` on port 8000)
- [x] Tests: 8/8 passing (mocked Neo4j, runs in CI)

### 3.2: Frontend API Integration (In Progress)

- [x] API client service (`services/api.ts`)
- [x] Pydantic response models with OpenAPI documentation
- [x] Shared test fixtures (conftest.py)
- [ ] Wire Zustand store actions to API calls
- [ ] Loading states and error handling
- [ ] Offline detection

### 3.3: Model CRUD Endpoints (Planned)

- [ ] Threat model create/read/update/delete
- [ ] Technical asset CRUD within a model
- [ ] Trust boundary CRUD
- [ ] Data flow CRUD
- [ ] Data asset CRUD

## Phase 4: Frontend Visualization (Planned)

### 4.1: Knowledge Graph Explorer (Completed)

- [x] Search bar with graph search API
- [x] Results list with node type badges
- [x] Node detail view with relationships
- [x] Graph statistics panel
- [x] Filter by node label
- [x] Sidebar navigation link

### 4.2: Enhanced Graph Visualization

- [ ] D3.js graph library integration (basic wrapper exists)
- [ ] Node rendering by type with styling
- [ ] Edge rendering with directional indicators
- [ ] Zoom, pan, node selection
- [ ] Force-directed layout

### 4.3: Interactive Elements

- [ ] Node/edge detail popups (basic version exists)
- [ ] Sidebar information display
- [ ] Drilldown navigation

## Phase 5: Analysis Pipeline (Planned)

### 5.1: Threat Mapping

- [ ] Map application graph nodes to CWE weaknesses
- [ ] Link CWEs to ATT&CK techniques via CAPEC
- [ ] Generate threat findings with severity ratings

### 5.2: Repository Importer

- [ ] Parse git repository structure (files, configs, dependencies)
- [ ] Identify services, APIs, databases from code
- [ ] Create application graph nodes in Neo4j
- [ ] Map dependencies to known vulnerabilities

### 5.3: LLM Analysis Integration

- [ ] LLM-powered threat narrative generation
- [ ] Automated mitigation recommendations
- [ ] Risk scoring and prioritization

## Phase 6: Infrastructure and Deployment (Planned)

- [ ] AWS CDK stack (Lambda, S3, CloudFront, Cognito)
- [ ] Authentication and authorization
- [ ] Production Docker deployment
- [ ] Monitoring and observability

## Current Test Suite

| Area | Tests | Status |
|------|-------|--------|
| Schema validation | 8 | Passing |
| CWE parser | 5 | Passing |
| CWE import (Neo4j) | 5 | Passing (requires DB) |
| ATT&CK parser | 6 | Passing |
| ATT&CK import (Neo4j) | 6 | Passing (requires DB) |
| CAPEC parser | 4 | Passing |
| CAPEC import (Neo4j) | 5 | Passing (requires DB) |
| Neo4j connection | 4 | Passing (requires DB) |
| API health | 3 | Passing |
| API graph routes | 5 | Passing |
| **Total** | **51** | **37 in CI, 51 with Neo4j** |

## Running Tests

```bash
# All tests except Neo4j integration (CI-safe)
docker compose -f docker-compose.dev.yml run --rm tests

# All tests including Neo4j integration (requires .env.dev with credentials)
docker compose -f docker-compose.dev.yml run --rm tests-all

# Run the API server
docker compose -f docker-compose.dev.yml up api
```
