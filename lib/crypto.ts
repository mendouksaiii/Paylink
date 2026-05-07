/**
 * Paylink — Cryptographic Utilities
 *
 * Handles the claim_seed ↔ UUID mapping for shareable URLs.
 *
 * Flow:
 *   1. Generate random 32-byte claim_seed
 *   2. Use first 16 bytes to create a UUID v4 for the URL
 *   3. Store full 32-byte seed in localStorage (sender-side backup)
 *   4. URL carries the UUID: paylink.app/c?id=<uuid>
 *   5. On claim page, look up full seed from UUID via localStorage or on-chain scan
 *
 * Since a UUID is only 16 bytes but our seed is 32 bytes, we encode
 * the full 32-byte seed as hex in the URL for claim pages. The UUID
 * format is used as the user-facing display ID.
 */

/**
 * Generate a random 32-byte claim seed.
 */
export function generateClaimSeed() {
  const seed = new Uint8Array(32);
  crypto.getRandomValues(seed);
  return seed;
}

/**
 * Convert a Uint8Array to a hex string.
 */
export function seedToHex(seed: Uint8Array): string {
  return Array.from(seed)
    .map((b: number) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert a hex string back to a Uint8Array.
 */
export function hexToSeed(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Create a UUID v4-style string from the first 16 bytes of the seed.
 * Used as the display ID in the URL.
 */
export function seedToDisplayId(seed: Uint8Array): string {
  const hex = seedToHex(seed.slice(0, 16));
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Generate the claim URL for a given seed.
 * Format: /c?id=<full 64-char hex>
 */
export function generateClaimUrl(seed: Uint8Array): string {
  const hex = seedToHex(seed);
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://paylink.app';
  return `${base}/c?id=${hex}`;
}

/**
 * Extract the seed from a claim URL's query parameter.
 */
export function extractSeedFromUrl(searchParams: URLSearchParams): Uint8Array | null {
  const id = searchParams.get('id');
  if (!id) return null;
  try {
    return hexToSeed(id);
  } catch {
    return null;
  }
}

/**
 * Store a created link in localStorage for dashboard recovery.
 */
export function storeCreatedLink(seed: Uint8Array, data: Record<string, unknown>) {
  const key = 'paylink_links';
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({
    seedHex: seedToHex(seed),
    displayId: seedToDisplayId(seed),
    ...data,
    createdAt: Date.now(),
  });
  localStorage.setItem(key, JSON.stringify(existing));
}

/**
 * Get all locally stored links for the dashboard.
 */
export function getStoredLinks() {
  const key = 'paylink_links';
  return JSON.parse(localStorage.getItem(key) || '[]');
}
