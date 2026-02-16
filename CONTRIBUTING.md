# Contributing to Threat Oracle

**Team**: Purple Morty (💜), PhenomSec Morty (🔒), HomeNet Morty (🏠)
**Channel**: #threat-oracle (Slack) — all coordination happens here
**Repo**: microbrewerGM/threat-oracle-internal

---

## Task Pickup Workflow

1. **Check the board**: `gh issue list --repo microbrewerGM/threat-oracle-internal --state open`
2. **Claim an issue**: Assign yourself and announce in #threat-oracle
3. **One active issue max** per Morty (per Aaron's rule) — finish or hand off before picking up the next
4. **Work in priority order**: P0-critical → P1-high → P2-medium
5. **Sprint order matters**: mvp-1 → mvp-2 → mvp-3 → mvp-4 (don't skip ahead unless unblocked work exists)
6. **When done**: Push your branch, open a PR, request review from another Morty, post in #threat-oracle
7. **Blocked?** Post the blocker in #threat-oracle immediately. If it needs Aaron, tag him as an alert.

## Commit Conventions

Format: `<type>(<scope>): <description>`

**Types:**
- `feat` — new feature or capability
- `fix` — bug fix
- `docs` — documentation only
- `test` — adding or updating tests
- `refactor` — code change that doesn't fix a bug or add a feature
- `chore` — tooling, CI, dependencies

**Scopes:** `graph`, `api`, `infra`, `analysis`, `frontend`, `docs`

**Examples:**
```
feat(graph): add CWE node importer with MITRE mappings
fix(api): handle missing repo URL in fetcher endpoint
docs(docs): update schema with CAPEC relationship types
test(analysis): add coverage for LLM pipeline edge cases
```

Keep commits atomic — one logical change per commit.

## Directory Ownership

| Directory | Owner | Purpose |
|-----------|-------|---------|
| `importers/` | Purple Morty | Graph data importers (CWE, ATT&CK, CAPEC, repos) |
| `analysis/` | Purple Morty | LLM analysis pipeline, threat mapping |
| `api/` | PSM | FastAPI endpoints, Lambda handlers |
| `infra/` | HomeNet Morty | AWS CDK/CloudFormation, S3, CloudFront, Cognito |
| `frontend/` | Unassigned | Next.js app (mvp-3) |
| `tests/` | Shared | All Morties write tests for their code |
| `docs/` | Shared | Schema docs, architecture, runbooks |
| `scripts/` | Shared | Utility scripts, CI helpers |

**Cross-ownership edits**: If you need to change files in another Morty's directory, open a PR and request their review. Don't merge without approval.

## Issue Labels

### Assignment
- `morty:purple` — assigned to Purple Morty
- `morty:psm` — assigned to PhenomSec Morty
- `morty:homenet` — assigned to HomeNet Morty
- `morty:unassigned` — available to claim

### Priority
- `P0-critical` — do this now, blocks others
- `P1-high` — core MVP work
- `P2-medium` — important but not blocking

### Type
- `type:infra` — AWS infrastructure
- `type:backend` — API/Lambda
- `type:frontend` — Next.js UI
- `type:graph` — Neo4j schema, Cypher, importers
- `type:analysis` — LLM pipeline, threat mapping
- `type:docs` — documentation

### Sprint
- `sprint:mvp-1` — infrastructure foundation
- `sprint:mvp-2` — analysis pipeline
- `sprint:mvp-3` — frontend + visualization
- `sprint:mvp-4` — polish, auth, catalog

## How to Break Down Tasks

When an issue is too big (>1 day of work), break it down:

1. Create sub-issues with clear acceptance criteria
2. Link them to the parent with "Part of #XX" in the description
3. Each sub-issue should be completable independently
4. Each sub-issue should have a test that proves it works

**Good breakdown example:**
- ❌ "Build the AWS importer" (too big)
- ✅ "#1: S3 bucket for frontend hosting" → "#2: CloudFront distribution" → "#3: Cognito user pool" (sequential, testable)

## Channel Rules (from Aaron)

1. **Acknowledge all messages** — check in periodically even without notifications
2. **No DMs** — everything visible to all in #threat-oracle
3. **Flat messages only** — no threads, post directly to channel
4. **Raise blockers immediately** — tag Aaron if it needs him
5. **Respect each other's boundaries and security protocols**

---

*Last updated: 2026-02-16 by Purple Morty*
