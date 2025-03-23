"""
Tests for the schema validator module.
"""

import pytest
from src.schema import validator


def test_load_schema():
    """Test loading a schema from file."""
    schema = validator.load_schema("technical_asset")
    assert schema is not None
    assert schema["title"] == "Technical Asset"
    assert "properties" in schema


def test_validate_valid_technical_asset():
    """Test validating a valid technical asset."""
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
    
    errors = validator.validate(valid_asset, "technical_asset")
    assert len(errors) == 0
    assert validator.is_valid(valid_asset, "technical_asset") is True


def test_validate_invalid_technical_asset():
    """Test validating an invalid technical asset."""
    # Missing required field 'type'
    invalid_asset = {
        "id": "web-server-001",
        "name": "Web Server"
    }
    
    errors = validator.validate(invalid_asset, "technical_asset")
    assert len(errors) > 0
    assert validator.is_valid(invalid_asset, "technical_asset") is False
    
    # Invalid value for 'criticality'
    invalid_asset = {
        "id": "web-server-001",
        "name": "Web Server",
        "type": "server",
        "criticality": "super-high"  # Not in enum
    }
    
    errors = validator.validate(invalid_asset, "technical_asset")
    assert len(errors) > 0
    assert validator.is_valid(invalid_asset, "technical_asset") is False


def test_validate_valid_trust_boundary():
    """Test validating a valid trust boundary."""
    valid_boundary = {
        "id": "dmz-001",
        "name": "DMZ",
        "type": "network_segment",
        "description": "Demilitarized zone between internet and internal network",
        "security_level": "dmz",
        "owner": "Security Team",
        "tags": ["network", "security"]
    }
    
    errors = validator.validate(valid_boundary, "trust_boundary")
    assert len(errors) == 0
    assert validator.is_valid(valid_boundary, "trust_boundary") is True


def test_validate_valid_data_flow():
    """Test validating a valid data flow."""
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
    
    errors = validator.validate(valid_flow, "data_flow")
    assert len(errors) == 0
    assert validator.is_valid(valid_flow, "data_flow") is True


def test_get_schema_properties():
    """Test getting schema properties."""
    properties = validator.get_schema_properties("technical_asset")
    assert "id" in properties
    assert "name" in properties
    assert "type" in properties


def test_get_required_properties():
    """Test getting required properties."""
    required = validator.get_required_properties("technical_asset")
    assert "id" in required
    assert "name" in required
    assert "type" in required


def test_nonexistent_schema():
    """Test handling of nonexistent schema."""
    with pytest.raises(FileNotFoundError):
        validator.load_schema("nonexistent_schema")
    
    errors = validator.validate({}, "nonexistent_schema")
    assert len(errors) > 0
    assert "not found" in errors[0]
