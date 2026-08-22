#!/bin/bash

# Script to run the Threat Oracle frontend in a Conda environment

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Conda is not installed. Please install Conda first."
    exit 1
fi

# Check if the threat-oracle environment exists
if ! conda env list | grep -q "threat-oracle"; then
    echo "Creating threat-oracle Conda environment..."
    conda env create -f environment.yml
else
    echo "Updating threat-oracle Conda environment..."
    conda env update -f environment.yml
fi

# Activate the environment and run the frontend
echo "Activating threat-oracle environment and installing frontend dependencies..."
conda run -n threat-oracle bash -c "cd src/frontend && npm install && npm run dev"
