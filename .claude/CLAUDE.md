# Threat Oracle — Claude Instructions

## Project Overview

Threat Oracle is a visual threat modeling tool that creates digital twins of applications and infrastructure using a graph-based approach (Neo4j). It ingests security knowledge bases (CWE, ATT&CK, CAPEC) and maps them onto repository graphs for automated threat analysis.

Stack: Python · FastAPI · Neo4j · Docker · AWS (CDK/Lambda/S3/CloudFront/Cognito)

See @ARCHITECTURE.md for component details and @CONTRIBUTING.md for team conventions.

## Commit Conventions

Format: `<type>(<scope>): <description>`

Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
Scopes: `graph`, `api`, `infra`, `analysis`, `frontend`, `docs`

Keep commits atomic — one logical change per commit.

## Testing

- All tests live in `tests/` — run via Docker: `docker compose -f docker-compose.dev.yml run --rm tests`
- Every new importer, analysis component, or API endpoint needs tests
- Test files mirror the source structure (e.g. `tests/importers/` for `importers/`)

## Directory Ownership

- `importers/` — graph data importers (CWE, ATT&CK, CAPEC, repos)
- `analysis/` — LLM analysis pipeline, threat mapping
- `api/` — FastAPI endpoints, Lambda handlers
- `src/` — core library code
- `tests/` — shared test suite

## Key Rules

- Never write credentials to files or expose them in CLI commands
- No hardcoded secrets — use environment variables loaded from `.env.dev` (gitignored)
- Neo4j Cypher queries go through the driver in `src/` — no raw string concatenation
- Pre-commit hooks are configured in `.pre-commit-config.yaml` — don't bypass with `--no-verify`
- Branch from `develop`, PR to `develop`; `main` is release-only
