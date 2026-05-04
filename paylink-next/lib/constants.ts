/**
 * Paylink — Global Constants
 */

// Program ID — replace with actual deployed program ID after `anchor deploy`
// Using System Program as valid placeholder until deployment
export const PROGRAM_ID = '11111111111111111111111111111111';

// RPC endpoints
export const RPC_ENDPOINTS = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
};

// Current network
export const NETWORK = 'devnet';
export const RPC_URL = RPC_ENDPOINTS[NETWORK];

// Default link expiry: 7 days in seconds
export const DEFAULT_EXPIRY_SECONDS = 7 * 24 * 60 * 60;

// Expiry presets (label, seconds)
export const EXPIRY_PRESETS = [
  { label: '1 Hour', value: 60 * 60 },
  { label: '24 Hours', value: 24 * 60 * 60 },
  { label: '7 Days', value: 7 * 24 * 60 * 60 },
  { label: '30 Days', value: 30 * 24 * 60 * 60 },
];

// Base URL for generated links
export const BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://paylink.app';
