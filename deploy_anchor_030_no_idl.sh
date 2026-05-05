#!/bin/bash
set -e

source $HOME/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.avm/bin:$PATH"

echo "Building Anchor contract (first pass)..."
anchor build --no-idl

echo "Syncing keys..."
anchor keys sync

echo "Building Anchor contract (second pass)..."
anchor build --no-idl

echo "Deploying Anchor contract..."
anchor deploy --provider.cluster devnet > deploy_output.txt
cat deploy_output.txt
