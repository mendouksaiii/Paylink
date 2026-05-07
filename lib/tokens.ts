/**
 * Paylink — Supported Token Definitions
 *
 * Each token has devnet and mainnet mint addresses.
 * The UI uses these for the token selector and account derivation.
 */
import { PublicKey } from '@solana/web3.js';
import { NETWORK } from './constants';

export const TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    color: '#2775ca',
    mint: {
      devnet: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
      mainnet: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    },
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    color: '#26a17b',
    mint: {
      devnet: new PublicKey('EJwZgeZrdC8TXTQbQBoL6bfuAnFUQYAjfRsrepJFaxav'),
      mainnet: new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'),
    },
  },
};

/**
 * Get the mint PublicKey for a token on the current network.
 */
export function getTokenMint(symbol: keyof typeof TOKENS) {
  const token = TOKENS[symbol];
  if (!token) throw new Error(`Unknown token: ${symbol}`);
  return token.mint[NETWORK];
}

/**
 * Find token info by mint address.
 */
export function getTokenByMint(mintAddress: string | { toString(): string }) {
  const mintStr = mintAddress.toString();
  for (const token of Object.values(TOKENS)) {
    if (token.mint.devnet.toString() === mintStr ||
        token.mint.mainnet.toString() === mintStr) {
      return token;
    }
  }
  return null;
}

/**
 * Format a raw token amount to human-readable string.
 */
export function formatTokenAmount(rawAmount: string | number, decimals = 6): string {
  const num = Number(rawAmount) / Math.pow(10, decimals);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse a human-readable amount to raw token units.
 */
export function parseTokenAmount(humanAmount: string | number, decimals = 6): number {
  return Math.floor(Number(humanAmount) * Math.pow(10, decimals));
}
