# Setup Guide

This guide covers three ways to run Threat Oracle, from quickest to most flexible.

## Option A: Quick Start (Local Neo4j via Docker)

The fastest path — a single command runs the frontend, backend, and a local Neo4j instance.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose

### Steps

```bash
# 1. Clone and enter the repo
git clone https://github.com/microbrewerGM/Threat-Oracle.git
cd Threat-Oracle

# 2. Start the full stack
docker compose up --build
```

This starts:

| Service  | URL                    | Credentials         |
|----------|------------------------|----------------------|
| Frontend | http://localhost:3000   | —                    |
| Backend  | http://localhost:8000   | —                    |
| Neo4j Browser | http://localhost:7474 | `neo4j` / `password` |

No `.env` file needed — `docker-compose.yml` includes a local Neo4j with default credentials.

### Load Knowledge Bases

Once the stack is running, import the security knowledge bases via the API:

```bash
# Download the data files first (see "Downloading Knowledge Base Data" below)

# Then trigger imports
curl -X POST http://localhost:8000/api/v1/import/trigger/cwe
curl -X POST http://localhost:8000/api/v1/import/trigger/attack
curl -X POST http://localhost:8000/api/v1/import/trigger/capec
```

---

## Option B: Cloud Neo4j (AuraDB Free Tier)

Use Neo4j's managed cloud database. The free tier is sufficient for development.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- A Neo4j AuraDB account (free)

### 1. Create an AuraDB Instance

1. Go to [Neo4j AuraDB](https://neo4j.com/cloud/aura-free/) and sign up (free tier available)
2. Click **New Instance** and select **AuraDB Free**
3. Choose a region close to you and click **Create**
4. **Save the generated password immediately** — it is only shown once
5. Wait for the instance status to show **Running**
6. Copy the **Connection URI** (looks like `neo4j+s://xxxxxxxx.databases.neo4j.io`)

### 2. Configure Environment

```bash
cp .env.dev.example .env.dev
```

Edit `.env.dev` with your AuraDB credentials:

```
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-generated-password
```

### 3. Run the Application

```bash
# Start the API (connects to your AuraDB instance)
docker compose -f docker-compose.dev.yml run --rm -p 8000:8000 api

# In another terminal, start the frontend
cd src/frontend
npm install
npm run dev
```

The frontend runs at http://localhost:5173 and proxies API requests to the backend.

### 4. Load Knowledge Bases

```bash
curl -X POST http://localhost:8000/api/v1/import/trigger/cwe
curl -X POST http://localhost:8000/api/v1/import/trigger/attack
curl -X POST http://localhost:8000/api/v1/import/trigger/capec
```

---

## Option C: Development Setup (Tests + API)

For contributors who want to run tests and develop locally.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Node.js 18+ (for frontend development)

### 1. Configure Environment

If running tests that require Neo4j (optional):

```bash
cp .env.dev.example .env.dev
# Fill in Neo4j credentials (local or AuraDB — see Option A or B)
```

### 2. Run Tests

```bash
# Backend tests (no Neo4j required — skips DB tests automatically)
docker compose -f docker-compose.dev.yml run --rm tests

# Backend tests including Neo4j integration tests (requires .env.dev)
docker compose -f docker-compose.dev.yml run --rm tests-all

# Frontend tests
cd src/frontend
npm install
npm test
```

### 3. Install Pre-commit Hooks

```bash
pip install pre-commit
pre-commit install
```

---

## Downloading Knowledge Base Data

The importers expect data files in the `data/` directory. These files are not checked into git due to their size.

### CWE (Common Weakness Enumeration)

```bash
mkdir -p data
curl -L -o data/cwec_v4.19.1.xml.zip \
  "https://cwe.mitre.org/data/xml/cwec_v4.19.1.xml.zip"
unzip data/cwec_v4.19.1.xml.zip -d data/
```

### MITRE ATT&CK

```bash
curl -L -o data/enterprise-attack.json \
  "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
```

### CAPEC (Common Attack Pattern Enumeration)

```bash
curl -L -o data/capec_latest.xml.zip \
  "https://capec.mitre.org/data/xml/capec_latest.xml.zip"
unzip data/capec_latest.xml.zip -d data/
```

### All at Once

```bash
mkdir -p data

# CWE
curl -L -o data/cwec_v4.19.1.xml.zip "https://cwe.mitre.org/data/xml/cwec_v4.19.1.xml.zip"
unzip -o data/cwec_v4.19.1.xml.zip -d data/

# ATT&CK
curl -L -o data/enterprise-attack.json "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"

# CAPEC
curl -L -o data/capec_latest.xml.zip "https://capec.mitre.org/data/xml/capec_latest.xml.zip"
unzip -o data/capec_latest.xml.zip -d data/
```

---

## Verifying Your Setup

### Health Check

```bash
curl http://localhost:8000/api/v1/health
# Returns: {"status": "healthy", ...}
```

### Browse the Graph

- **Neo4j Browser** (local only): http://localhost:7474
- **Threat Oracle Frontend**: http://localhost:5173 (dev) or http://localhost:3000 (Docker)
- **API Docs**: http://localhost:8000/docs (Swagger UI)

### Check Import Status

After importing, the Knowledge Graph Explorer page shows node counts and allows searching across CWE, ATT&CK, and CAPEC data.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `NEO4J_URI and NEO4J_PASSWORD environment variables are required` | Create `.env.dev` from the example: `cp .env.dev.example .env.dev` and fill in credentials |
| `CWE XML file not found in data/` | Download the knowledge base files (see above) |
| AuraDB connection timeout | Check that your AuraDB instance is **Running** in the console and the URI is correct |
| Port 8000 already in use | Stop other services on that port, or change the port mapping in docker-compose |
| Frontend can't reach API | Ensure the backend is running on port 8000; Vite proxies `/api` automatically |
