#!/bin/bash
set -e

source $HOME/.cargo/env
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"


avm install 0.30.1 || true
avm use 0.30.1

echo "Generating deploy wallet..."
mkdir -p ~/.config/solana
solana-keygen new --outfile ~/.config/solana/id.json --no-bip39-passphrase --force || true
solana config set --url devnet

echo "Airdropping devnet SOL..."
solana airdrop 2 || true
solana airdrop 2 || true
BALANCE=$(solana balance | grep -o '^[0-9.]*')

if awk -v bal="$BALANCE" 'BEGIN {exit !(bal == 0)}'; then
  echo "CRITICAL: You have 0 SOL. The devnet airdrop is rate limited."
  echo "Please go to https://faucet.solana.com/ and drop devnet SOL to:"
  solana address
  exit 1
fi

echo "Building Anchor contract..."
anchor build

echo "Deploying Anchor contract..."
anchor deploy --provider.cluster devnet > deploy_output.txt
cat deploy_output.txt
