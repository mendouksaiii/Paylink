#!/bin/bash
set -e

source $HOME/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

avm install 0.29.0 || true
avm use 0.29.0

echo "Updating wasm-bindgen to fix Rust 1.79 compatibility..."
cd programs/paylink
cargo update -p wasm-bindgen
cd ../..

echo "Building Anchor contract (first pass)..."
anchor build

echo "Syncing keys..."
anchor keys sync

echo "Building Anchor contract (second pass)..."
anchor build

echo "Deploying Anchor contract..."
anchor deploy --provider.cluster devnet > deploy_output.txt
cat deploy_output.txt
