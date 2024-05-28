# Threat Oracle

## Introduction

Welcome to the Open Source Threat Modeling project! This project aims to provide a comprehensive solution for threat modeling applications, CI/CD pipelines, and runtime environments. By building a digital twin of the application and infrastructure, we can visualize and analyze potential risks and threats using Neo4j's Bloom. The digital twin is represented as a graph data structure, capturing data flows and interactions within the application. This graph twin is then matched to custom risk and threat rules or CWE data to discover vulnerabilities and potential threats.

## Features

- **Digital Twin Creation**: Build a digital twin of your application and infrastructure.
- **Graph Data Structure**: Represent the application and data flows as a graph.
- **Visualization**: Visualize the digital twin using Neo4j's Bloom.
- **Threat and Risk Analysis**: Match the graph twin to custom risk and threat rules or CWE data to discover vulnerabilities.

## Getting Started

### Prerequisites

- [Neo4j](https://neo4j.com/download/)
- [Neo4j Bloom](https://neo4j.com/bloom/)
- Python 3.x
- [Py2neo](https://py2neo.org/)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/microbrewerGM/Threat-Oracle.git
    cd threat-oracle
    ```

2. Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```

3. Set up Neo4j and ensure it is running.

### Usage

1. Initialize the digital twin properties schema:
    ```bash
    python initialize_schema.py
    ```

2. Connect to the Neo4j database:
    ```bash
    python connect_db.py
    ```

3. Visualize the digital twin:
    
    TBD - Navigate to Bloom.

## Roadmap

### Phase 1: Base Application Structure
- [x] Initialize project repository
- [x] Set up basic directory structure and initial files
- [ ] Define project goals and objectives

### Phase 2: Digital Twin Properties Schema
- [ ] Define the schema for the digital twin properties
- [ ] Create initial schema in Neo4j

### Phase 3: Database Connectivity
- [ ] Set up connection to Neo4j database
- [ ] Implement basic CRUD operations

### Phase 4: Graph Visualization
- [ ] Integrate Neo4j Bloom for visualization
- [ ] Develop visualization tests and examples

### Phase 5: Threat and Risk Analysis
- [ ] Develop custom risk and threat rules
- [ ] Integrate CWE data
- [ ] Implement threat and risk analysis

## Active Tasks

1. **Base Application Structure**:
    - Initialize project repository
    - Set up basic directory structure and initial files

2. **Digital Twin Properties Schema**:
    - Define the schema for the digital twin properties
    - Create initial schema in Neo4j

3. **Database Connectivity**:
    - Set up connection to Neo4j database
    - Implement basic CRUD operations

4. **Graph Visualization**:
    - Integrate Neo4j Bloom for visualization
    - Develop visualization tests and examples

## Contributing

We welcome contributions from the community. Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

We would like to thank the open source community for their lead, support and contributions.

---

Thank you for your attention.

For any questions or suggestions, please feel free to open an issue or contact us directly.

---
