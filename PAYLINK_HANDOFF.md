# PayLink — Developer Handoff & Build Status

## Project Overview
PayLink is a Venmo-style payment link protocol built on Solana. Users escrow USDC/USDT on-chain and generate a shareable URL. Recipients authenticate via Twilio OTP (no wallet required) and off-ramp to fiat via MoonPay.

## Current Build Status: End-to-End Flow Complete

### 1. Smart Contract (Anchor) — `programs/paylink/src/lib.rs`
- **Status:** Deployed to Devnet.
- **Program ID:** `3aNvxijKXfz2VBDEH5iKXnvebjUretGgtgFwzqFjP5EV`
- **Instructions:** `create_link`, `claim`, `reclaim`
- **Features:** Multi-token (USDC/USDT), strict ownership constraints, PDA escrow, rent reclamation, event emission.

### 2. Frontend (Next.js 16 App Router) — `paylink-next/`
- **Landing Page** (`app/page.tsx`) — Dark cinematic theme, parallax hero, framer-motion animations.
- **Create Page** (`app/create/page.tsx`) — Token selector, amount input, expiry presets. Executes on-chain `createLink`, writes to Supabase, stores to localStorage.
- **Claim Page** (`app/c/page.tsx`) — Multi-step flow: amount display → phone entry → OTP verify → server-side on-chain claim → MoonPay off-ramp widget.
- **Dashboard** (`app/dashboard/page.tsx`) — Fetches on-chain links via `memcmp`, localStorage fallback, filter tabs, reclaim button.

### 3. Backend API Routes
| Route | Purpose |
|---|---|
| `POST /api/create-claim` | Inserts a claim row into Supabase after on-chain escrow creation |
| `GET /api/claim/[id]` | Looks up a claim for the recipient's claim page |
| `POST /api/send-otp` | Generates & sends OTP via Twilio (WhatsApp → SMS fallback) |
| `POST /api/verify-otp` | Verifies OTP, generates session token, marks claim as verified |
| `POST /api/execute-claim` | Server-side on-chain claim execution via relayer keypair |
| `POST /api/moonpay-sign` | HMAC-SHA256 URL signing for MoonPay widget security |

### 4. Integrations
- **Supabase** — `claims` and `otps` tables. Schema in `supabase-schema.sql`.
- **Twilio** — WhatsApp-first OTP with SMS fallback. HMAC-hashed phone/OTP storage.
- **MoonPay** — Official `@moonpay/moonpay-react` SDK with server-side URL signing.
- **Solana Wallet Adapter** — Phantom wallet integration for senders.

### 5. Version Control
- **Remote:** `https://github.com/mendouksaiii/Paylink.git`
- **Branch:** `main`

---

## Environment Variables Required (`.env.local`)
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=whatsapp:+...
TWILIO_PHONE_NUMBER=+...
OTP_SECRET=...
SESSION_SECRET=...
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_MOONPAY_API_KEY=pk_test_...
MOONPAY_SECRET_KEY=sk_test_...
RELAYER_PRIVATE_KEY=           # base64 of 64-byte Solana keypair
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_PRIVY_APP_ID=...
```

## Setup Steps for New Developer
1. `cd paylink-next && npm install`
2. Run `supabase-schema.sql` in the Supabase SQL Editor
3. Fill in `.env.local` with real credentials
4. `npm run dev`

## Remaining Items
1. **MoonPay Sandbox Keys** — Need real keys from MoonPay dashboard
2. **Relayer Keypair** — Generate a Devnet keypair and fund it for server-side claims
3. **Twilio Production Numbers** — Current numbers are sandbox-only
4. **E2E Test** — Full flow test with real Devnet funds once keys are in place
