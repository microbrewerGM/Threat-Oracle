---
paths:
  - "**/*.py"
  - "tests/**/*.py"
---

# Python Conventions

- Use type hints on all function signatures
- Prefer dataclasses or Pydantic models over plain dicts for structured data
- Importers must implement the base importer interface in `importers/`
- Use `pytest` fixtures for shared test setup — no setUp/tearDown
- Neo4j driver usage: always use parameterized queries, never f-strings in Cypher
