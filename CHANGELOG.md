# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Data asset schema definition for representing various types of information assets
- Simple web interface with React and TypeScript
- Basic visualization of threat model components
- Navigation between different views
- Sample data for demonstration purposes
- Docker and Conda environment support
- Enhanced visualization with card-like popups for assets and data flows
- Added drilldown functionality to navigate to detailed views
- Implemented edge popup functionality to show data flow information

- Initial project vision
- README.md with enhanced project description
- .gitignore file for Python, JavaScript/TypeScript, and database files
- DEVELOPMENT_PLAN.md with incremental approach to feature implementation
- CHANGELOG.md to track project changes
- INTERACTION_LOG.md to record developer and LLM interactions
- ARCHITECTURE.md with comprehensive software architecture and design
- GIT_WORKFLOW.md with detailed git workflow and best practices
- MARKDOWN_GUIDELINES.md with best practices for formatting documentation
- .markdownlint.json configuration for consistent Markdown formatting
- Basic schema definitions for technical assets, trust boundaries, and data flows
- Schema validator module with comprehensive test suite
- Example script demonstrating schema validation

### Changed

- Renamed original README.md to threat_oracle_vision.md
- Restructured project to start fresh implementation
- Updated git workflow to include mandatory user approval step

### Security

- Updated frontend dependencies to address esbuild vulnerability (CVE-2023-45133)
- Updated vite, vite-node, vitest, and related packages to latest secure versions
- Updated backend Python dependencies to latest versions, including:
  - fastapi from 0.104.1 to 0.115.12
  - uvicorn from 0.23.2 to 0.34.0
  - pydantic from 2.4.2 to 2.10.6
  - neo4j from 5.14.0 to 5.28.1
  - httpx from 0.25.0 to 0.28.1
  - Added cryptography 44.0.2
- Updated dev dependencies including black, ruff, mypy, and pre-commit

### Removed

- Moved old code to old_code/ directories for reference

## [0.0.0] - 2025-03-22

- Project inception
