"""
This module provides a Streamlit application for threat modeling,
allowing users to list and view available model files in a specified directory.
"""

import streamlit as st
import requests
import plotly.graph_objects as go
import networkx as nx

# Function to visualize technical assets and trust boundaries
def visualize_technical_assets(technical_assets, trust_boundaries):
    G = nx.Graph()
    
    # Add nodes and edges based on technical assets and their communication links
    for asset_name, asset_data in technical_assets.items():
        asset_id = asset_data['id']
        G.add_node(asset_id)

        if 'communication_links' in asset_data and isinstance(asset_data['communication_links'], dict):
            for link_name, link_data in asset_data['communication_links'].items():
                target_id = link_data.get('target_id')
                if target_id:
                    G.add_edge(asset_id, target_id)

    pos = nx.spring_layout(G)

    edge_x = []
    edge_y = []
    for edge in G.edges():
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        edge_x.extend([x0, x1, None])
        edge_y.extend([y0, y1, None])

    node_x = [pos[node][0] for node in G.nodes()]
    node_y = [pos[node][1] for node in G.nodes()]

    node_groups = [G.degree(node) for node in G.nodes()]

    fig = go.Figure()

    # Add edges
    fig.add_trace(go.Scatter(x=edge_x, y=edge_y, mode='lines', line=dict(width=0.5, color='#888')))

    # Define node labels
    node_labels = [asset_name for asset_name in technical_assets.keys()]

    # Add nodes with labels
    fig.add_trace(go.Scatter(x=node_x, y=node_y, mode='markers+text',
                             marker=dict(size=40, color=node_groups, 
                                         colorscale='Viridis', 
                                         line=dict(width=2, color='DarkSlateGrey')),
                             text=node_labels[:len(G.nodes())],
                             textposition="top center",
                             textfont=dict(size=14)))

    gap = 0.5  # Gap between trust boundaries

    def draw_boundary(boundary_name, boundary_data):
        asset_ids = boundary_data.get('technical_assets_inside', [])
        if asset_ids:
            boundary_x = [pos[asset_id][0] for asset_id in asset_ids if asset_id in pos]
            boundary_y = [pos[asset_id][1] for asset_id in asset_ids if asset_id in pos]

            if boundary_x and boundary_y:
                x0 = min(boundary_x) - gap
                y0 = min(boundary_y) - gap
                x1 = max(boundary_x) + gap
                y1 = max(boundary_y) + gap

                fig.add_shape(type="rect",
                              x0=x0, y0=y0,
                              x1=x1, y1=y1,
                              line=dict(color="RoyalBlue", width=2),
                              fillcolor="rgba(0, 0, 255, 0.1)")

                fig.add_annotation(
                    x=(x0 + x1) / 2,
                    y=y0 - 0.1,
                    text=f"{boundary_name} ({boundary_data['type']})",
                    showarrow=False,
                    font=dict(size=10, color="black"),
                    align="center",
                    bgcolor="rgba(255, 255, 255, 0.7)",
                    bordercolor="black",
                    borderwidth=1,
                    borderpad=4
                )

    for boundary_name, boundary_data in trust_boundaries.items():
        draw_boundary(boundary_name, boundary_data)

        nested_boundaries = boundary_data.get('trust_boundaries_nested', [])
        for nested_boundary_name in nested_boundaries:
            nested_boundary_data = trust_boundaries.get(nested_boundary_name)
            if nested_boundary_data:
                draw_boundary(nested_boundary_name, nested_boundary_data)

    fig.update_layout(
        xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
        plot_bgcolor='rgba(0, 0, 0, 0)',
        paper_bgcolor='rgba(0, 0, 0, 0)'
    )

    st.plotly_chart(fig)

# Streamlit UI
st.title("Threat Model Visualization")

# Fetch model names from the API
response = requests.get('http://127.0.0.1:5000/api/model-names')
model_names = response.json()

# Dropdown selector for models
model_choice = st.selectbox("Select a threat model:", options=[""] + model_names)

if model_choice:
    # Fetch data for the selected model
    model_response = requests.get('http://127.0.0.1:5000/api/threat-models')
    data = model_response.json()

    # Display the selected model's JSON object
    selected_model_data = data.get(model_choice.replace('.yaml', ''), {})
    st.json(selected_model_data)

    # Display metadata
    st.header(selected_model_data.get('title', ''))
    
    # Display schema version with reduced font size
    schema_version = selected_model_data.get('schema_version', '')
    st.markdown(f"<h6 style='font-size: 12px;'>Schema Version: {schema_version}</h6>", unsafe_allow_html=True)
    
    # Display date with reduced font size
    date = selected_model_data.get('date', '')
    st.markdown(f"<h6 style='font-size: 12px;'>Date: {date}</h6>", unsafe_allow_html=True)

    # List technical assets in a collapsible section
    with st.expander("Technical Assets", expanded=True):
        st.markdown("**Technical Assets:**")  # Bold text
        technical_assets = selected_model_data.get('technical_assets', {})
        for asset_name in technical_assets.keys():
            st.write(f"- {asset_name}")

    # List trust boundaries in a collapsible section
    with st.expander("Trust Boundaries", expanded=True):
        st.write("### Trust Boundaries:")
        trust_boundaries = selected_model_data.get('trust_boundaries', {})
        
        def display_trust_boundaries(boundaries, indent=0):
            for boundary_name, boundary_data in boundaries.items():
                st.write(f"{'  ' * indent}- {boundary_name} ({boundary_data['type']})")
                
                # List technical assets inside the boundary
                nested_assets = boundary_data.get('technical_assets_inside', [])
                if nested_assets:
                    for asset in nested_assets:
                        st.write(f"{'  ' * (indent + 1)}- {asset}")
                
                # List nested boundaries
                nested_boundaries = boundary_data.get('trust_boundaries_nested', [])
                if nested_boundaries:
                    display_trust_boundaries({nested: boundaries[nested] for nested in nested_boundaries}, indent + 1)

        display_trust_boundaries(trust_boundaries)

    # Visualize the selected threat model
    visualize_technical_assets(technical_assets, trust_boundaries)
