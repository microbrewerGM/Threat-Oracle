#!/usr/bin/env python3
"""
Demo script for the schema validator.

This script demonstrates how to use the schema validator to validate
technical assets, trust boundaries, and data flows.
"""

import json
import os
import sys

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.schema import validator


def print_section(title):
    """Print a section title."""
    print("\n" + "=" * 80)
    print(f" {title} ".center(80, "="))
    print("=" * 80 + "\n")


def validate_and_print(obj, schema_name):
    """Validate an object against a schema and print the results."""
    print(f"Validating against {schema_name} schema:")
    print(f"Object: {json.dumps(obj, indent=2)}")
    
    errors = validator.validate(obj, schema_name)
    
    if errors:
        print("\nValidation errors:")
        for error in errors:
            print(f"  - {error}")
    else:
        print("\nValidation successful! The object is valid.")
    
    print("\nRequired properties:")
    required = validator.get_required_properties(schema_name)
    print(f"  {', '.join(required)}")
    
    print("\nAll available properties:")
    properties = validator.get_schema_properties(schema_name)
    print(f"  {', '.join(properties.keys())}")


def main():
    """Run the demo."""
    print_section("Schema Validator Demo")
    
    # Example 1: Valid technical asset
    print_section("Example 1: Valid Technical Asset")
    valid_asset = {
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
    validate_and_print(valid_asset, "technical_asset")
    
    # Example 2: Invalid technical asset (missing required field)
    print_section("Example 2: Invalid Technical Asset (Missing Required Field)")
    invalid_asset = {
        "id": "web-server-001",
        "name": "Web Server"
        # Missing required 'type' field
    }
    validate_and_print(invalid_asset, "technical_asset")
    
    # Example 3: Valid trust boundary
    print_section("Example 3: Valid Trust Boundary")
    valid_boundary = {
        "id": "dmz-001",
        "name": "DMZ",
        "type": "network_segment",
        "description": "Demilitarized zone between internet and internal network",
        "security_level": "dmz",
        "owner": "Security Team",
        "tags": ["network", "security"]
    }
    validate_and_print(valid_boundary, "trust_boundary")
    
    # Example 4: Valid data flow
    print_section("Example 4: Valid Data Flow")
    valid_flow = {
        "id": "flow-001",
        "source_id": "web-server-001",
        "target_id": "db-server-001",
        "protocol": "https",
        "name": "Web to DB Communication",
        "description": "Data flow from web server to database server",
        "port": 443,
        "is_encrypted": True,
        "authentication_method": "certificate",
        "crosses_trust_boundary": True,
        "trust_boundary_id": "dmz-001"
    }
    validate_and_print(valid_flow, "data_flow")


if __name__ == "__main__":
    main()
