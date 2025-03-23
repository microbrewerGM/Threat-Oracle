# Threat Oracle

## Introduction

Threat modeling is a critical security practice that helps identify, communicate, and understand threats and mitigations
within a system. However, traditional threat modeling requires significant expertise, is often manual, and lacks visual
representation that makes complex systems understandable.

Threat Oracle aims to revolutionize this process by providing a visual-first, schema-backed, graph-based threat modeling
tool that makes security accessible to everyone. By creating a digital twin of your applications and infrastructure,
Threat Oracle enables you to visualize, analyze, and mitigate security risks without requiring deep expertise in threat
modeling methodologies.

## The Problem

Current threat modeling approaches face several challenges:

- They require significant expertise in security and threat modeling
- Many tools are document-based (like Word) or tightly coupled to specific technologies
- The process is manual, time-consuming, and error-prone
- Few solutions offer visual, digital, or graph-based representations
- Existing tools lack AI assistance to guide users through the process

## Our Solution

Threat Oracle addresses these challenges by:

- Providing a web-based, visual-first approach to threat modeling
- Using a flexible, schema-backed graph structure to model systems
- Supporting automated analysis through graph-based risk rules
- Planning for LLM and voice query integration to make interaction natural
- Enabling automatic model generation from code repositories
- Offering a flexible schema that can model physical, organizational, software, data, and personas

## Features

- **Visual Digital Twin**: Create a comprehensive visual representation of your applications and infrastructure as a graph.
- **Flexible Graph Schema**: Model technical assets, trust boundaries, data flows, actors, and security controls with
  customizable properties.
- **Automated Risk Detection**: Define and apply graph-based rules to automatically identify security risks and vulnerabilities.
- **Modern Web Interface**: Interact with your models through a beautiful, intuitive interface built with modern web technologies.
- **Database Flexibility**: Support for Neo4j, Bloom, GraphQL, and Aurora graph databases depending on your operational environment.

## Target Audience

Initially, Threat Oracle is designed for:

- Security architects
- Software architects
- DevSecOps engineers

As the tool evolves with more AI assistance and improved usability, we aim to expand to:

- Business analysts
- Product managers
- Business stakeholders

## Project Documentation

Threat Oracle maintains comprehensive documentation to guide development and usage:

- [**Architecture**](ARCHITECTURE.md): Detailed software architecture and design
- [**Development Plan**](DEVELOPMENT_PLAN.md): Incremental approach to feature implementation
- [**Git Workflow**](GIT_WORKFLOW.md): Git workflow and best practices
- [**Contributing Guidelines**](CONTRIBUTING.md): How to contribute to the project
- [**Markdown Guidelines**](MARKDOWN_GUIDELINES.md): Best practices for formatting documentation
- [**Changelog**](CHANGELOG.md): Record of all notable changes
- [**Interaction Log**](INTERACTION_LOG.md): Record of developer and LLM interactions
- [**Original Vision**](threat_oracle_vision.md): Initial project vision

## Current State

Threat Oracle is in early development. Currently implemented features:

- **Schema Definitions**: JSON Schema definitions for technical assets, trust boundaries, and data flows
- **Schema Validator**: Utility for validating objects against these schemas
- **Example Usage**: Demo script showing schema validation in action

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/microbrewerGM/Threat-Oracle.git
   cd Threat-Oracle
   ```

2. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Install pre-commit hooks:

   ```bash
   pre-commit install
   ```

### Running Tests

```bash
python -m pytest
```

### Running the Demo

```bash
python examples/schema_validator_demo.py
```

## Development Workflow

We follow a feature-branch workflow with mandatory user approval before pushing code.
See [Git Workflow](GIT_WORKFLOW.md) for details.

## Contributing

We welcome contributions from the community. Please read our
[Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

We would like to thank the open source community for their leadership, support, and contributions.

Especially, we would like to thank the open source project [Threagile](https://github.com/Threagile/threagile) for inspiration!

---

For any questions or suggestions, please feel free to open an issue or contact us directly.
