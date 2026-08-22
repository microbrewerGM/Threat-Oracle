# Schema Module

This module defines the JSON schemas for the Threat Oracle graph model and provides utilities for validating objects
against these schemas.

## Schemas

The module includes the following schemas:

- `technical_asset.json`: Schema for technical assets (nodes)
- `trust_boundary.json`: Schema for trust boundaries (nodes)
- `data_flow.json`: Schema for data flows (edges)

## Validator

The `validator.py` module provides functions for validating objects against these schemas:

- `load_schema(schema_name)`: Load a schema from file
- `validate(obj, schema_name)`: Validate an object against a schema
- `is_valid(obj, schema_name)`: Check if an object is valid
- `get_schema_properties(schema_name)`: Get the properties defined in a schema
- `get_required_properties(schema_name)`: Get the required properties defined in a schema

## Example Usage

```python
from src.schema import validator

# Create a technical asset
asset = {
    "id": "web-server-001",
    "name": "Web Server",
    "type": "server",
    "description": "Main web server for the application",
    "owner": "Infrastructure Team",
    "criticality": "high",
    "technology_stack": ["Apache", "Ubuntu", "PHP"],
    "version": "2.4",
    "tags": ["web", "public-facing"]
}

# Validate the asset
errors = validator.validate(asset, "technical_asset")
if errors:
    print(f"Validation errors: {errors}")
else:
    print("Asset is valid")

# Check if an object is valid
is_valid = validator.is_valid(asset, "technical_asset")
print(f"Is valid: {is_valid}")

# Get schema properties
properties = validator.get_schema_properties("technical_asset")
print(f"Properties: {list(properties.keys())}")

# Get required properties
required = validator.get_required_properties("technical_asset")
print(f"Required properties: {required}")
```
