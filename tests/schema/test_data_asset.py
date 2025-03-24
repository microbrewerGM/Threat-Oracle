"""
Tests for the data asset schema validation.
"""

import pytest
from src.schema import validator


def test_validate_valid_data_asset():
    """Test validating a valid data asset."""
    valid_asset = {
        "id": "data-001",
        "name": "Customer Records",
        "type": "pii",
        "medium": "digital",
        "classification": "confidential",
        "description": "Customer personal information including names, addresses, and contact details",
        "format": "JSON",
        "volume": "10GB",
        "owner": "Data Management Team",
        "retention_period": "7 years",
        "regulatory_requirements": ["GDPR", "CCPA"],
        "encryption_requirements": "both",
        "integrity_requirements": "high",
        "availability_requirements": "medium",
        "stored_in": ["ta-003"],
        "processed_by": ["ta-002"],
        "transmitted_in": ["df-002"],
        "tags": ["customer", "personal"]
    }
    
    errors = validator.validate(valid_asset, "data_asset")
    assert len(errors) == 0
    assert validator.is_valid(valid_asset, "data_asset") is True


def test_validate_valid_physical_data_asset():
    """Test validating a valid physical data asset."""
    valid_asset = {
        "id": "data-002",
        "name": "Paper Medical Records",
        "type": "phi",
        "medium": "physical",
        "classification": "restricted",
        "description": "Physical paper records containing patient medical history",
        "owner": "Medical Records Department",
        "retention_period": "10 years",
        "regulatory_requirements": ["HIPAA"],
        "integrity_requirements": "high",
        "availability_requirements": "medium",
        "stored_in": ["ta-005"],
        "tags": ["medical", "paper"]
    }
    
    errors = validator.validate(valid_asset, "data_asset")
    assert len(errors) == 0
    assert validator.is_valid(valid_asset, "data_asset") is True


def test_validate_invalid_data_asset_missing_required():
    """Test validating an invalid data asset with missing required fields."""
    # Missing required fields 'type', 'medium', and 'classification'
    invalid_asset = {
        "id": "data-003",
        "name": "Configuration Files"
    }
    
    errors = validator.validate(invalid_asset, "data_asset")
    assert len(errors) > 0
    assert validator.is_valid(invalid_asset, "data_asset") is False


def test_validate_invalid_data_asset_invalid_enum():
    """Test validating an invalid data asset with invalid enum values."""
    # Invalid value for 'type'
    invalid_asset = {
        "id": "data-004",
        "name": "Financial Records",
        "type": "financial",  # Not in enum
        "medium": "digital",
        "classification": "confidential"
    }
    
    errors = validator.validate(invalid_asset, "data_asset")
    assert len(errors) > 0
    assert validator.is_valid(invalid_asset, "data_asset") is False
    
    # Invalid value for 'medium'
    invalid_asset = {
        "id": "data-005",
        "name": "Financial Records",
        "type": "pfi",
        "medium": "cloud",  # Not in enum
        "classification": "confidential"
    }
    
    errors = validator.validate(invalid_asset, "data_asset")
    assert len(errors) > 0
    assert validator.is_valid(invalid_asset, "data_asset") is False
    
    # Invalid value for 'classification'
    invalid_asset = {
        "id": "data-006",
        "name": "Financial Records",
        "type": "pfi",
        "medium": "digital",
        "classification": "ultra-secret"  # Not in enum
    }
    
    errors = validator.validate(invalid_asset, "data_asset")
    assert len(errors) > 0
    assert validator.is_valid(invalid_asset, "data_asset") is False


def test_get_data_asset_schema_properties():
    """Test getting data asset schema properties."""
    properties = validator.get_schema_properties("data_asset")
    assert "id" in properties
    assert "name" in properties
    assert "type" in properties
    assert "medium" in properties
    assert "classification" in properties


def test_get_data_asset_required_properties():
    """Test getting data asset required properties."""
    required = validator.get_required_properties("data_asset")
    assert "id" in required
    assert "name" in required
    assert "type" in required
    assert "medium" in required
    assert "classification" in required
