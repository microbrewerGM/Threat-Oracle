"""
This module provides a Streamlit application for threat modeling,
allowing users to list and view available model files in a specified directory.
"""

import os
import streamlit as st
import yaml  # Importing the PyYAML library
from pyvis.network import Network

def list_model_files(directory):
    """
    List all model files in the specified directory.
    """
    try:
        files = os.listdir(directory)
        model_files = [f for f in files if f.endswith('.yaml')]
        return model_files
    except OSError as e:
        st.error(f"Error reading directory: {e}")
        return []

def get_model_metadata(file_path):
    """
    Function to retrieve metadata from the specified model file.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            metadata = yaml.safe_load(file)
            if isinstance(metadata.get("technical_assets"), dict):
                return {**metadata, "file_path": file_path}
            else:
                return {"error": "Technical assets data is not in the expected format."}
    except (FileNotFoundError, yaml.YAMLError) as e:
        return {"error": str(e)}

def visualize_technical_assets(technical_assets):
    """
    Visualize the technical assets and their communication links using pyvis.
    """
    net = Network(height='600px', width='800px', directed=True)

    # Create nodes for the graph
    for asset_name, asset_data in technical_assets.items():
        asset_id = asset_data['id']
        net.add_node(asset_id, label=asset_name)

    # Track the number of edges between each pair of nodes
    edge_count = {}

    # Add edges after all nodes have been created
    for asset_name, asset_data in technical_assets.items():
        asset_id = asset_data['id']

        # Check if communication_links exists and is a dictionary
        if 'communication_links' in asset_data and isinstance(asset_data['communication_links'], dict):
            for link_name, link_data in asset_data['communication_links'].items():
                # Check if link_data is None
                if link_data is None:
                    print(f"Warning: link_data for '{link_name}' in '{asset_id}' is None.")
                    continue  # Skip this link if it's None

                target_id = link_data.get('target_id')
                if target_id is None:
                    print(f"Warning: target_id is missing for link '{link_name}' in '{asset_id}'.")
                    continue  # Skip this link if target_id is missing

                protocol = link_data.get('protocol', 'Unknown Protocol')

                # Create a unique key for the edge
                edge_key = (asset_id, target_id)

                # Initialize the count for this edge if it doesn't exist
                if edge_key not in edge_count:
                    edge_count[edge_key] = 0

                # Get the current count and increment it
                current_count = edge_count[edge_key]
                edge_count[edge_key] += 1

                # Define different styles for edges
                color = "gray"  # Default color
                dash = "solid"  # Default dash style

                # Change styles based on the count
                if current_count == 0:
                    color = "red"
                    dash = "dashed"  # Dashed line
                elif current_count == 1:
                    color = "blue"
                    dash = "dotted"  # Dotted line
                elif current_count == 2:
                    color = "green"
                    dash = "solid"  # Solid line

                # Check if the target node exists before adding the edge
                if target_id in net.get_nodes():
                    net.add_edge(asset_id, target_id, label=protocol, color=color, title=protocol)
                else:
                    print(f"Warning: Target node '{target_id}' does not exist for edge from '{asset_id}'.")

    # Generate the graph and render it in Streamlit
    html = net.generate_html()  # Generate HTML directly
    st.components.v1.html(html, height=600, width=800)

def main():
    """
    Main function to run the Streamlit application for threat modeling.
    """
    st.title("Threat Modeling App")
    
    model_directory = "models"
    
    st.subheader("Available Model Files:")
    model_files = list_model_files(model_directory)
    
    selected_model = st.selectbox("Select a model file:", options=[""] + model_files)
    
    if selected_model:
        st.write(f"You selected: {selected_model}")
        metadata = get_model_metadata(os.path.join(model_directory, selected_model))
        
        st.write("Metadata:", metadata)
        
        if "error" not in metadata:
            st.header(metadata["title"])
            st.write("File Path:", metadata["file_path"])
            st.write("Schema Version:", metadata["schema_version"])
            st.write("Date:", metadata["date"])
            st.write("Technical Assets:")
            
            technical_assets = metadata.get("technical_assets", {})
            if isinstance(technical_assets, dict):
                st.markdown("<ul>" + "".join(f"<li>{asset}</li>" for asset in technical_assets.keys()) + "</ul>", unsafe_allow_html=True)
                
                # Visualize the technical assets and communication links
                visualize_technical_assets(technical_assets)
            else:
                st.error("Technical assets data is not in the expected format.")
    else:
        st.write("No model file selected.")

if __name__ == "__main__":
    main()
