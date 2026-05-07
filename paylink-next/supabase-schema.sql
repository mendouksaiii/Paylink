-- PayLink Supabase Schema
-- Run this in the Supabase SQL Editor to create the required tables.

-- Claims table: tracks every payment link created
CREATE TABLE IF NOT EXISTS claims (
  id            TEXT PRIMARY KEY,              -- UUID from the claim seed
  sender_pubkey TEXT NOT NULL,                 -- Solana pubkey of the sender
  claim_seed    TEXT NOT NULL,                 -- Full 64-char hex seed
  amount_usdc   NUMERIC NOT NULL,             -- Human-readable amount (e.g. 50.00)
  token         TEXT NOT NULL DEFAULT 'USDC',  -- 'USDC' or 'USDT'
  mint_address  TEXT NOT NULL,                 -- SPL mint pubkey
  expiry_ts     BIGINT NOT NULL,              -- Unix timestamp when link expires
  status        TEXT NOT NULL DEFAULT 'pending', -- pending | verified | claimed | expired
  tx_signature  TEXT,                          -- On-chain tx hash from createLink
  claim_tx      TEXT,                          -- On-chain tx hash from claim
  recipient_phone_hash TEXT,                   -- HMAC hash of recipient phone (set on OTP verify)
  session_token TEXT,                          -- Session token (set on OTP verify)
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- OTPs table: stores hashed OTP codes for verification
CREATE TABLE IF NOT EXISTS otps (
  id         BIGSERIAL PRIMARY KEY,
  claim_id   TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  phone_hash TEXT NOT NULL,                    -- HMAC hash of the phone number
  otp_hash   TEXT NOT NULL,                    -- HMAC hash of the OTP code
  expiry_ts  BIGINT NOT NULL,                  -- Unix timestamp when OTP expires
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_sender ON claims(sender_pubkey);
CREATE INDEX IF NOT EXISTS idx_otps_claim_id ON otps(claim_id);
CREATE INDEX IF NOT EXISTS idx_otps_lookup ON otps(claim_id, phone_hash, used);

-- Auto-update updated_at on claims
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS claims_updated_at ON claims;
CREATE TRIGGER claims_updated_at
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
