/**
 * Paylink — Anchor Program Utilities
 *
 * Provides the Anchor program instance and PDA derivation helpers.
 */
import { PublicKey, Connection } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PROGRAM_ID } from './constants';

// Anchor 0.30+ IDL spec — instruction discriminators required, writable/signer for accounts
// IDL_VERSION: anchor-0.32-spec-v3
export const IDL = {
  address: PROGRAM_ID,
  metadata: {
    name: 'paylink',
    version: '0.1.0',
    spec: '0.1.0',
  },
  instructions: [
    {
      name: 'create_link',
      discriminator: [103, 114, 207, 84, 216, 71, 234, 61],
      accounts: [
        { name: 'sender', writable: true, signer: true },
        { name: 'escrow_account', writable: true },
        { name: 'escrow_token_account', writable: true },
        { name: 'sender_token_account', writable: true },
        { name: 'token_mint' },
        { name: 'token_program' },
        { name: 'system_program' },
      ],
      args: [
        { name: 'amount', type: 'u64' },
        { name: 'claim_seed', type: { array: ['u8', 32] } },
        { name: 'expiry_ts', type: 'i64' },
      ],
    },
    {
      name: 'claim',
      discriminator: [62, 198, 214, 193, 213, 159, 108, 210],
      accounts: [
        { name: 'recipient', signer: true },
        { name: 'sender', writable: true },
        { name: 'escrow_account', writable: true },
        { name: 'escrow_token_account', writable: true },
        { name: 'recipient_token_account', writable: true },
        { name: 'token_program' },
      ],
      args: [
        { name: 'claim_seed', type: { array: ['u8', 32] } },
      ],
    },
    {
      name: 'reclaim',
      discriminator: [44, 177, 236, 249, 145, 109, 163, 186],
      accounts: [
        { name: 'sender', writable: true, signer: true },
        { name: 'escrow_account', writable: true },
        { name: 'escrow_token_account', writable: true },
        { name: 'sender_token_account', writable: true },
        { name: 'token_program' },
      ],
      args: [
        { name: 'claim_seed', type: { array: ['u8', 32] } },
      ],
    },
  ],
  accounts: [
    {
      name: 'EscrowAccount',
      discriminator: [36, 69, 48, 18, 128, 225, 125, 135],
    },
  ],
  errors: [
    { code: 6000, name: 'AlreadyClaimed', msg: 'This link has already been claimed.' },
    { code: 6001, name: 'LinkExpired', msg: 'This link has expired.' },
    { code: 6002, name: 'NotYetExpired', msg: 'Link has not yet expired.' },
    { code: 6003, name: 'Unauthorized', msg: 'Only the original sender can reclaim.' },
    { code: 6004, name: 'ZeroAmount', msg: 'Amount must be greater than zero.' },
    { code: 6005, name: 'ExpiryInPast', msg: 'Expiry timestamp must be in the future.' },
    { code: 6006, name: 'InvalidTokenAccountOwner', msg: 'Token account owner does not match expected wallet.' },
    { code: 6007, name: 'MintMismatch', msg: 'Token mint does not match the escrow mint.' },
  ],
  types: [
    {
      name: 'EscrowAccount',
      type: {
        kind: 'struct',
        fields: [
          { name: 'sender', type: 'pubkey' },
          { name: 'mint', type: 'pubkey' },
          { name: 'amount', type: 'u64' },
          { name: 'claim_seed', type: { array: ['u8', 32] } },
          { name: 'expiry_ts', type: 'i64' },
          { name: 'claimed', type: 'bool' },
          { name: 'bump', type: 'u8' },
        ],
      },
    },
  ],
};

const programId = new PublicKey(PROGRAM_ID);

/**
 * Get the Anchor program instance from a wallet + connection.
 */
export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
  });
  return new Program(IDL as any, provider);
}

/**
 * Derive the escrow account PDA.
 */
export function getEscrowPDA(claimSeed: Uint8Array) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow'), Buffer.from(claimSeed)],
    programId
  );
}

/**
 * Derive the escrow token account PDA.
 */
export function getEscrowTokenPDA(claimSeed: Uint8Array) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('escrow-token'), Buffer.from(claimSeed)],
    programId
  );
}

/**
 * Map Anchor error codes to user-friendly messages.
 */
export function getErrorMessage(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  const errorStr = error.toString();

  // Check for Anchor program errors
  const anchorError = IDL.errors.find(e =>
    errorStr.includes(e.code.toString()) || errorStr.includes(e.name)
  );
  if (anchorError) return anchorError.msg;

  // Common Solana errors
  if (errorStr.includes('Insufficient funds')) return 'Insufficient token balance.';
  if (errorStr.includes('User rejected')) return 'Transaction was rejected.';
  if (errorStr.includes('Blockhash not found')) return 'Network congestion. Please try again.';

  if (error instanceof Error) {
    return `Debug Error [v2-pubkey]: ${error.message}`;
  }

  return `Raw Error: ${errorStr}`;
}
