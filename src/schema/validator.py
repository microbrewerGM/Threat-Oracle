"""
Schema validation module for Threat Oracle.

This module provides functions to validate objects against JSON schemas.
"""

import json
import os
from typing import Any, Dict, List, Optional, Union

import jsonschema
from jsonschema import ValidationError

# Directory containing schema files
SCHEMA_DIR = os.path.dirname(os.path.abspath(__file__))

# Cache for loaded schemas
_schema_cache: Dict[str, Dict[str, Any]] = {}


def load_schema(schema_name: str) -> Dict[str, Any]:
    """
    Load a JSON schema from file.

    Args:
        schema_name: Name of the schema file without extension

    Returns:
        The loaded schema as a dictionary

    Raises:
        FileNotFoundError: If the schema file does not exist
        json.JSONDecodeError: If the schema file contains invalid JSON
    """
    if schema_name in _schema_cache:
        return _schema_cache[schema_name]

    schema_path = os.path.join(SCHEMA_DIR, f"{schema_name}.json")
    
    with open(schema_path, "r") as f:
        schema = json.load(f)
    
    _schema_cache[schema_name] = schema
    return schema


def validate(obj: Dict[str, Any], schema_name: str) -> List[str]:
    """
    Validate an object against a schema.

    Args:
        obj: The object to validate
        schema_name: Name of the schema file without extension

    Returns:
        A list of validation error messages, empty if validation succeeds
    """
    try:
        schema = load_schema(schema_name)
        jsonschema.validate(instance=obj, schema=schema)
        return []
    except ValidationError as e:
        # Return a list of validation error messages
        return [e.message]
    except FileNotFoundError:
        return [f"Schema '{schema_name}' not found"]
    except json.JSONDecodeError:
        return [f"Schema '{schema_name}' contains invalid JSON"]


def is_valid(obj: Dict[str, Any], schema_name: str) -> bool:
    """
    Check if an object is valid according to a schema.

    Args:
        obj: The object to validate
        schema_name: Name of the schema file without extension

    Returns:
        True if the object is valid, False otherwise
    """
    return len(validate(obj, schema_name)) == 0


def get_schema_properties(schema_name: str) -> Dict[str, Any]:
    """
    Get the properties defined in a schema.

    Args:
        schema_name: Name of the schema file without extension

    Returns:
        A dictionary of property names and their definitions

    Raises:
        FileNotFoundError: If the schema file does not exist
        KeyError: If the schema does not have a properties field
    """
    schema = load_schema(schema_name)
    return schema.get("properties", {})


def get_required_properties(schema_name: str) -> List[str]:
    """
    Get the required properties defined in a schema.

    Args:
        schema_name: Name of the schema file without extension

    Returns:
        A list of required property names

    Raises:
        FileNotFoundError: If the schema file does not exist
    """
    schema = load_schema(schema_name)
    return schema.get("required", [])
