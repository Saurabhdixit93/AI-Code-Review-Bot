#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
# We set CARGO_HOME to a writable location in case any package 
# needs to be built from source (Rust-based packages)
export CARGO_HOME=/tmp/cargo
mkdir -p $CARGO_HOME

python -m pip install --upgrade pip
python -m pip install -r requirements.txt
