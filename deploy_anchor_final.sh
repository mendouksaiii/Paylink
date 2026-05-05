#!/bin/bash
set -e

source $HOME/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "Checking Devnet Balance:"
solana balance

echo "Building Anchor contract..."
anchor build

echo "Deploying Anchor contract..."
anchor deploy --provider.cluster devnet > deploy_output.txt
cat deploy_output.txt
