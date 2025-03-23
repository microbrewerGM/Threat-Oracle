# Threat Oracle

## Introduction

Threat modeling is a critical security practice that helps identify, communicate, and understand threats and mitigations within a system. However, traditional threat modeling requires significant expertise, is often manual, and lacks visual representation that makes complex systems understandable.

Threat Oracle aims to revolutionize this process by providing a visual-first, schema-backed, graph-based threat modeling tool that makes security accessible to everyone. By creating a digital twin of your applications and infrastructure, Threat Oracle enables you to visualize, analyze, and mitigate security risks without requiring deep expertise in threat modeling methodologies.

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
- **Flexible Graph Schema**: Model technical assets, trust boundaries, data flows, actors, and security controls with customizable properties.
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

## Graph Structure

Threat Oracle's core strength lies in its graph-based representation of systems. The graph consists of:

### Core Entity Types (Nodes)

1. **Technical Assets**: Systems, applications, servers, containers, databases, APIs
2. **Trust Boundaries**: Network segments, security zones, organizational boundaries
3. **Data Assets**: Information types processed or stored
4. **Actors/Personas**: Users, roles, external entities interacting with the system
5. **Security Controls**: Implemented safeguards and countermeasures

### Key Relationships (Edges)

1. **Data Flows**: How data moves between technical assets
2. **Access Relationships**: How actors interact with technical assets
3. **Trust Relationships**: How entities cross trust boundaries
4. **Dependency Relationships**: How technical assets depend on each other
5. **Protection Relationships**: How security controls protect assets

## Roadmap

### Phase 1: Foundation
- Define the core graph schema
- Implement the basic web interface
- Create visualization capabilities
- Establish database integration

### Phase 2: Enhancement
- Develop automated risk detection rules
- Implement basic code repository scanning
- Add collaboration features
- Improve visualization capabilities

### Phase 3: AI Integration
- Add LLM assistance for model creation
- Implement voice query capabilities
- Enhance automated model generation from code
- Develop advanced risk detection algorithms

## Getting Started

*Coming soon*

## Contributing

We welcome contributions from the community. Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

We would like to thank the open source community for their leadership, support, and contributions.

Especially, we would like to thank the open source project [Threagile](https://github.com/Threagile/threagile) for inspiration!

---

For any questions or suggestions, please feel free to open an issue or contact us directly.
