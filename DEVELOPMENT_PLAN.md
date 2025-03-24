# Threat Oracle Development Plan

This document outlines our approach to developing Threat Oracle in small, manageable increments while incorporating best practices from the start.

## Development Philosophy

We will follow these principles:

1. **Start Small, Iterate Often**: Begin with the simplest possible implementation that provides value, then iterate.
2. **Test-Driven Development**: Write tests before implementing features.
3. **Documentation First**: Document the expected behavior before writing code.
4. **API-First Design**: Design APIs before implementing them.
5. **Continuous Integration**: Automate testing and deployment from the beginning.

## Phase 0: Project Setup (Completed)

- [x] Create initial project vision
- [x] Set up Git repository
- [x] Create .gitignore file
- [x] Set up basic project structure
- [x] Create CHANGELOG.md
- [x] Create INTERACTION_LOG.md for recording developer and LLM interactions
- [x] Set up linting and code formatting
- [x] Set up testing framework
- [x] Create initial documentation structure
- [x] Set up CI/CD pipeline

## Phase 1: Core Schema Definition (Completed)

### Increment 1.1: Basic Schema Structure (Completed)

- [x] Define the base schema interface
- [x] Implement basic validation
- [x] Create tests for schema validation
- [x] Document schema structure

### Increment 1.2: Technical Asset Nodes (Completed)

- [x] Define schema for technical asset nodes
- [x] Implement validation for technical asset properties
- [x] Create tests for technical asset validation
- [x] Document technical asset schema

### Increment 1.3: Trust Boundary Nodes (Completed)

- [x] Define schema for trust boundary nodes
- [x] Implement validation for trust boundary properties
- [x] Create tests for trust boundary validation
- [x] Document trust boundary schema

### Increment 1.5: Basic Relationships (Edges) (Completed)

- [x] Define schema for basic relationships between nodes (data flows)
- [x] Implement validation for relationship properties
- [x] Create tests for relationship validation
- [x] Document relationship schema

### Increment 1.4: Data Asset Nodes (Completed)

- [x] Define schema for data asset nodes
- [x] Implement validation for data asset properties
- [x] Create tests for data asset validation
- [x] Document data asset schema

## Phase 2: Basic Visualization (Current)

### Increment 2.1: Graph Data Structure (In Progress)

- [ ] Implement core graph data structure
- [ ] Create methods for adding/removing nodes and edges
- [ ] Implement basic graph traversal
- [ ] Create tests for graph operations

### Increment 2.2: Simple Web Interface (Completed)

- [x] Set up basic web application structure
- [x] Create simple UI for viewing nodes and edges
- [x] Implement basic navigation
- [x] Add tests for UI components

### Increment 2.3: Basic Visualization

#### Increment 2.3.1: Graph Library Integration (1-2 days)
- [ ] Select and integrate a graph visualization library (D3.js, vis.js, etc.)
- [ ] Create a basic wrapper component for the library
- [ ] Implement basic graph rendering with placeholder nodes
- [ ] Add tests for the wrapper component

#### Increment 2.3.2: Basic Node Visualization (2-3 days)
- [ ] Implement technical asset node rendering with basic styling
- [ ] Add visual distinction between different node types
- [ ] Implement basic labeling for nodes
- [ ] Add tests for node rendering

#### Increment 2.3.3: Basic Edge Visualization (1-2 days)
- [ ] Implement data flow edge rendering with directional indicators
- [ ] Add visual styling for edges
- [ ] Implement basic labeling for edges
- [ ] Add tests for edge rendering

### Increment 2.4: Interactive Elements

#### Increment 2.4.1: Basic Interaction Handlers (2-3 days)
- [ ] Implement zoom and pan functionality
- [ ] Add node/edge selection capability
- [ ] Implement hover effects
- [ ] Add tests for interaction handlers

#### Increment 2.4.2: Asset Information Display (2-3 days)
- [ ] Create a simple sidebar for displaying selected node/edge information
- [ ] Implement data binding between selection and information display
- [ ] Add basic formatting for different asset types
- [ ] Add tests for information display

#### Increment 2.4.3: Enhanced Popup Implementation (2-3 days)
- [ ] Create card-like popup components for nodes
- [ ] Implement sectioned information display
- [ ] Add drilldown functionality with visual indicators (double chevron symbol)
- [ ] Add tests for popup components

### Increment 2.5: Enhanced Visualization (User Requested)
- [ ] Enhance info popups to display pertinent asset information in card-like format
- [ ] Implement sectioned cards with categorized asset information
- [ ] Add drilldown capability to access detailed asset data from popup
- [ ] Include visual indicators (double chevron symbol) for drilldown functionality
- [ ] Ensure consistent styling across all asset types (technical, data, trust boundaries)
- [ ] Create tests for enhanced visualization features

### Increment 2.6: Layout and Styling

#### Increment 2.6.1: Auto-Layout Functionality (2-3 days)
- [ ] Implement force-directed layout algorithm
- [ ] Add manual node positioning capability
- [ ] Implement layout persistence
- [ ] Add tests for layout functionality

#### Increment 2.6.2: Visual Styling Enhancements (1-2 days)
- [ ] Implement consistent color scheme for different asset types
- [ ] Add visual indicators for risk levels or security status
- [ ] Implement customizable node/edge appearance
- [ ] Add tests for styling components

## Phase 3: Model Creation and Editing (Weeks 5-6)

### Increment 3.1: Model Creation

#### Increment 3.1.1: Node Creation (2-3 days)
- [ ] Implement UI for adding new technical asset nodes
- [ ] Create form validation for required fields
- [ ] Add capability to position new nodes on the graph
- [ ] Add tests for node creation

#### Increment 3.1.2: Edge Creation (2-3 days)
- [ ] Implement UI for adding data flows between nodes
- [ ] Create source/target selection interface
- [ ] Add form validation for relationship properties
- [ ] Add tests for edge creation

#### Increment 3.1.3: Trust Boundary Creation (2-3 days)
- [ ] Implement UI for defining trust boundaries
- [ ] Create capability to group nodes within boundaries
- [ ] Add styling for boundary visualization
- [ ] Add tests for boundary creation

### Increment 3.2: Model Editing

#### Increment 3.2.1: Property Editing Interface (2-3 days)
- [ ] Create reusable property editing components
- [ ] Implement form validation for different property types
- [ ] Add support for specialized property editors (e.g., enum dropdowns)
- [ ] Add tests for property editing components

#### Increment 3.2.2: Node Editing (2-3 days)
- [ ] Implement technical asset editing interface
- [ ] Add data asset editing interface
- [ ] Create trust boundary editing interface
- [ ] Add tests for node editing

#### Increment 3.2.3: Edge Editing (1-2 days)
- [ ] Implement data flow relationship editing
- [ ] Add support for changing source/target nodes
- [ ] Create validation for relationship constraints
- [ ] Add tests for edge editing

### Increment 3.3: Model Import/Export

#### Increment 3.3.1: Model Export (1-2 days)
- [ ] Implement export to JSON functionality
- [ ] Add option to export selected components or entire model
- [ ] Create export format validation
- [ ] Add tests for export functionality

#### Increment 3.3.2: Model Import (2-3 days)
- [ ] Implement import from JSON interface
- [ ] Add validation for imported models
- [ ] Create conflict resolution for duplicates
- [ ] Add tests for import functionality

#### Increment 3.3.3: Import/Export Extensions (1-2 days)
- [ ] Add support for CSV import/export for tabular data
- [ ] Implement template-based exports
- [ ] Create documentation for import/export formats
- [ ] Add tests for extended import/export features

### Increment 3.4: Model Versioning

#### Increment 3.4.1: Version Tracking (2-3 days)
- [ ] Implement model versioning mechanism
- [ ] Create version metadata storage
- [ ] Add user interface for version management
- [ ] Add tests for version tracking

#### Increment 3.4.2: History Viewing (1-2 days)
- [ ] Implement model history browser
- [ ] Add ability to view model at specific versions
- [ ] Create version comparison visualization
- [ ] Add tests for history viewing

#### Increment 3.4.3: Collaborative Features (2-3 days)
- [ ] Add user attribution for changes
- [ ] Implement change comments/annotations
- [ ] Create basic review workflow
- [ ] Add tests for collaborative features

## Phase 4: Database Integration (Weeks 7-8)

### Increment 4.1: Neo4j Integration

#### Increment 4.1.1: Database Connection Setup (1-2 days)
- [ ] Set up Neo4j connection configuration
- [ ] Create database connection management classes
- [ ] Implement connection pooling
- [ ] Add tests for database connectivity

#### Increment 4.1.2: Model Persistence (2-3 days)
- [ ] Implement graph model to Neo4j mapping
- [ ] Create CRUD operations for nodes
- [ ] Implement CRUD operations for relationships
- [ ] Add tests for persistence operations

#### Increment 4.1.3: Model Retrieval (2-3 days)
- [ ] Implement model loading from database
- [ ] Create efficient query patterns for graph traversal
- [ ] Add caching mechanisms for frequently accessed data
- [ ] Add tests for model retrieval

### Increment 4.2: Query Interface

#### Increment 4.2.1: Basic Query Building (2-3 days)
- [ ] Create query builder interface for graph pattern matching
- [ ] Implement node and relationship filtering
- [ ] Add property-based search capabilities
- [ ] Add tests for query building

#### Increment 4.2.2: Predefined Queries (1-2 days)
- [ ] Implement common threat model queries
- [ ] Create parameterized query templates
- [ ] Add query result formatting
- [ ] Add tests for predefined queries

#### Increment 4.2.3: Advanced Query Features (2-3 days)
- [ ] Implement path finding and graph traversal queries
- [ ] Add aggregation and analytics queries
- [ ] Create visualization-specific query optimizations
- [ ] Add tests for advanced query features

### Increment 4.3: GraphQL API

#### Increment 4.3.1: GraphQL Schema Definition (1-2 days)
- [ ] Define GraphQL types for nodes and relationships
- [ ] Create GraphQL queries and mutations
- [ ] Implement schema stitching for complex operations
- [ ] Add tests for schema validation

#### Increment 4.3.2: GraphQL Resolvers (2-3 days)
- [ ] Implement resolvers for queries
- [ ] Create resolvers for mutations
- [ ] Add authentication and authorization in resolvers
- [ ] Add tests for resolvers

#### Increment 4.3.3: GraphQL API Endpoints (1-2 days)
- [ ] Create API endpoints for GraphQL
- [ ] Implement GraphQL Playground for testing
- [ ] Add documentation for API usage
- [ ] Add tests for API endpoints

### Increment 4.4: Database Abstraction

#### Increment 4.4.1: Abstraction Layer Design (1-2 days)
- [ ] Design database abstraction interfaces
- [ ] Create adapter pattern for different database types
- [ ] Implement factory methods for database connections
- [ ] Add tests for abstraction design

#### Increment 4.4.2: Multiple Database Support (2-3 days)
- [ ] Add support for Neo4j
- [ ] Implement adapter for SQL databases
- [ ] Create adapter for in-memory graph (for testing)
- [ ] Add tests for multiple database types

#### Increment 4.4.3: Database Switching (1-2 days)
- [ ] Implement runtime database switching
- [ ] Create database migration utilities
- [ ] Add configuration for database selection
- [ ] Add tests for database switching

## Implementing Best Practices

### Version Control with Git

- Use feature branches for all new development
- Create meaningful commit messages
- Review code before merging to main
- Tag releases with semantic versioning

### Documentation

- Use docstrings for all functions, classes, and modules
- Keep README.md updated with current project status
- Maintain separate documentation for API, schema, and user guides
- Generate documentation automatically as part of the build process

### Testing

- Write unit tests for all new code
- Aim for high test coverage (>80%)
- Include integration tests for key features
- Set up automated testing in CI/CD pipeline

### Code Quality

- Use a linter (e.g., ESLint for JS/TS, Pylint for Python)
- Use a code formatter (e.g., Prettier for JS/TS, Black for Python)
- Enforce consistent coding standards
- Perform regular code reviews

### Changelog and Interaction Log

- Update CHANGELOG.md for each release
- Record significant changes, additions, and fixes
- Maintain INTERACTION_LOG.md to document developer and LLM interactions
- Use these logs to track project evolution and decision-making

### Secrets Management

- Never commit secrets to the repository
- Use environment variables for configuration
- Consider using a secrets management tool for production
- Document the process for managing secrets

### API-First Approach

- Design APIs before implementing features
- Create OpenAPI/Swagger documentation
- Validate API design through reviews
- Test APIs independently of UI

## Getting Started

To begin implementing this plan:

1. Set up the basic project structure
2. Implement the core schema interface
3. Create the first test cases
4. Set up the documentation framework
5. Establish the CI/CD pipeline

By following this incremental approach and incorporating best practices from the start, we'll build a solid foundation for Threat Oracle while making steady, visible progress.
