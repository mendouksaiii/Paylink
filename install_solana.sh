#!/bin/bash
set -e

source $HOME/.cargo/env
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 avm --locked --force
avm install 0.30.1
avm use 0.30.1
