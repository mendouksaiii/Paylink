# PayLink — Developer Handoff & Build Status

## Project Overview
PayLink is a Venmo-style payment link protocol built on Solana. It enables users to escrow stablecoins (USDC/USDT) on-chain and generate a shareable URL (e.g., `paylink.app/c?id=<uuid>`). A recipient can open the link, connect a wallet (or authenticate via other means), and claim the funds. Unclaimed funds can be automatically recovered by the sender after a preset expiration period.

## Current Build Status: Next.js Migration Complete & Landing Page Finalized

### 1. Smart Contract (Anchor) — `programs/paylink/src/lib.rs`
- **Status:** Code complete, hardened, but **NOT deployed locally**.
- **Features implemented:**
  - Multi-token support via `mint` pubkey validation.
  - Ownership constraints on all token accounts.
  - Rent reclamation mechanisms (`close = sender`).
  - Strict security constraints (no zero amounts, future-dated expiries).
  - Event emission (`LinkCreated`, `LinkClaimed`, `LinkReclaimed`).
- **Note:** The user's Windows environment lacks `cargo build-sbf`, so `anchor build` was skipped. The IDL interface was manually written into the frontend instead.

### 2. Frontend Infrastructure (Next.js 16 App Router) — `paylink-next/`
- **Status:** Successfully migrated from Vite SPA to Next.js App Router for better SEO, performance, and future secure backend API integrations.
- **Dependencies:** `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/wallet-adapter-react`, `framer-motion`, `lucide-react`.
- **Wallet Setup:** Configured correctly via standard Solana Wallet Adapter context.

### 3. Frontend UI & Pages
- **Design System:** Deep navy/dark theme established, utilizing glassmorphism, responsive grid layouts, and smooth `framer-motion` animations.
- **Home (`app/page.tsx`):** Completely revamped. Features a full-bleed photo background (`landing-bg.jpg`) with a dark cinematic gradient overlay. Includes new compelling, non-technical copywriting ("Your grandma doesn't need a wallet. She just needs a link."), custom SVG logo, and detailed security/use-case sections.
- **Create (`app/create/page.tsx`):** The interface for selecting a stablecoin, entering the amount, setting expiry, and generating the claim link.
- **Dashboard (`app/dashboard/page.tsx`):** Fetches and displays active, claimed, and expired links.
- **Claim (`app/c/page.tsx`):** The recipient view. Extracts the UUID from the URL, handles the claim flow, and abstracts away technical complexities.

### 4. Codebase & Version Control
- **Git:** All work (including the Next.js migration and visual overhaul) has been committed and pushed to GitHub.
- **Remote URL:** `https://github.com/mendouksaiii/Paylink.git`
- **Branch:** `main`

---

## Technical Blockers & Hacks to be aware of
1. **Placeholder Program ID:** Because the Anchor contract is not yet deployed, the project currently uses the Solana System Program ID (`11111111111111111111111111111111`) as a base58 placeholder in the frontend. *Any attempt to execute a transaction will fail on-chain until the real program is deployed and this ID is updated.*
2. **Local Storage Fallback:** To allow frontend development without a live contract, `localStorage` fallbacks are heavily utilized to store created links so the dashboard can render mock data.

## Next Steps for the Next AI/Developer
If taking over this project, the immediate next steps are:
1. **Deploy Contract:** Deploy the `paylink` program to Solana Devnet via a machine with the complete Solana CLI/Cargo build suite installed.
2. **Update Program ID:** Update `PROGRAM_ID` across the frontend constants with the newly deployed address.
3. **Verify Contract Integration:** Test the end-to-end `createLink`, `claimLink`, and `reclaimLink` flows against the deployed Devnet contract using Phantom wallet and Devnet SPL tokens.
4. **Backend Implementation:** Now that Next.js App Router is active, set up the secure API routes required for the Web2 Auth flow (e.g., Twilio OTP verification for recipients without wallets) and Moonpay off-ramping.
