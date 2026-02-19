"""Import trigger endpoints for loading security knowledge bases."""
import os
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException
from neo4j import Driver

from api.dependencies import get_neo4j_driver

router = APIRouter(prefix="/api/v1/import", tags=["import"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")


class ImportSource(str, Enum):
    cwe = "cwe"
    attack = "attack"
    capec = "capec"


@router.post("/trigger/{source}")
def trigger_import(
    source: ImportSource,
    driver: Driver = Depends(get_neo4j_driver),
):
    """Trigger an import of a security knowledge base into Neo4j.

    Supported sources: cwe, attack, capec.
    Data files must exist in the data/ directory.
    """
    if source == ImportSource.cwe:
        xml_path = os.path.join(DATA_DIR, "cwec_v4.19.1.xml")
        if not os.path.exists(xml_path):
            raise HTTPException(status_code=404, detail="CWE XML file not found in data/")

        from importers.cwe_importer import parse_cwe_xml, import_cwe_to_neo4j

        weaknesses = parse_cwe_xml(xml_path)
        node_count, edge_count = import_cwe_to_neo4j(driver, weaknesses)
        return {
            "source": "cwe",
            "status": "completed",
            "nodes_imported": node_count,
            "relationships_imported": edge_count,
        }

    elif source == ImportSource.attack:
        json_path = os.path.join(DATA_DIR, "enterprise-attack.json")
        if not os.path.exists(json_path):
            raise HTTPException(status_code=404, detail="ATT&CK JSON file not found in data/")

        from importers.attack_importer import parse_attack_stix, import_attack_to_neo4j

        objects, relationships = parse_attack_stix(json_path)
        node_count, rel_count = import_attack_to_neo4j(driver, objects, relationships)
        return {
            "source": "attack",
            "status": "completed",
            "nodes_imported": node_count,
            "relationships_imported": rel_count,
        }

    elif source == ImportSource.capec:
        xml_path = os.path.join(DATA_DIR, "capec_latest.xml")
        if not os.path.exists(xml_path):
            raise HTTPException(status_code=404, detail="CAPEC XML file not found in data/")

        from importers.capec_importer import parse_capec_xml, import_capec_to_neo4j

        patterns = parse_capec_xml(xml_path)
        node_count, cwe_edges, attack_edges = import_capec_to_neo4j(driver, patterns)
        return {
            "source": "capec",
            "status": "completed",
            "nodes_imported": node_count,
            "cwe_relationships": cwe_edges,
            "attack_relationships": attack_edges,
        }
