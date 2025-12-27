#!/bin/bash
# ===========================================
# Python Worker - Start Script for Render
# ===========================================

# Exit on error
set -e

echo "Starting Python Worker Deployment..."

# Set Python path to current directory to ensure src is importable
export PYTHONPATH=$PYTHONPATH:.

# Start the worker
echo "Launching Worker..."
exec python -m src.main
