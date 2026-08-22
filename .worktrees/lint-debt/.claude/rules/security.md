---
paths:
  - "api/**"
  - "src/**"
  - "importers/**"
---

# Security Rules

- No credentials, tokens, or API keys in source files — use environment variables
- Validate and sanitize all external inputs (MITRE/NVD/GitHub API responses) before graph insertion
- Cypher queries must use parameterized statements to prevent injection
- AWS resources must follow least-privilege IAM — no wildcard `*` actions in policies
- HTTP endpoints must validate Content-Type and reject unexpected payloads
- Log security-relevant events (auth failures, schema violations) but never log secrets
