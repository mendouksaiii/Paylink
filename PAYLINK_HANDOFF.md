# Paylink — Developer Handoff & Build Status

## Project Overview
Paylink is a Venmo-style payment link protocol on Solana. It allows users to escrow USDC or USDT on-chain and generate a shareable URL (e.g., `paylink.app/c?id=<uuid>`). A recipient can open the link, connect their wallet, and claim the funds without needing to provide their wallet address beforehand. Unclaimed funds can be recovered by the sender after an expiration period.

## Current Build Status: Phase 4 (On-Chain Wiring Complete)

### 1. Smart Contract (Anchor) — `programs/paylink/src/lib.rs`
- **Status:** Code complete, hardened, but **NOT deployed locally**.
- **Features implemented:**
  - Multi-token support via `mint` pubkey validation.
  - Ownership constraints on all token accounts.
  - Rent reclamation mechanisms (`close = sender`).
  - Strict security constraints (no zero amounts, future-dated expiries).
  - Event emission (`LinkCreated`, `LinkClaimed`, `LinkReclaimed`).
- **Note:** The user's Windows environment lacks `cargo build-sbf`, so `anchor build` was skipped. The IDL interface was manually written into the frontend instead.

### 2. Frontend Infrastructure (Vite + React) — `app/`
- **Status:** Scaffolding and build pipeline complete.
- **Dependencies:** `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/wallet-adapter-react`, `react-router-dom`.
- **Polyfills:** `vite-plugin-node-polyfills` is installed and active in `vite.config.js` to handle Solana's `Buffer` dependencies in the browser.
- **Wallet:** `PhantomWalletAdapter` is configured via `WalletProvider`.

### 3. Frontend UI & Pages
- **Design System (`src/index.css`):** Fully implemented with a premium "Cyber-Luxury" aesthetic (glassmorphism, dark theme, gradient meshes).
- **Home (`src/pages/Home.jsx`):** Landing page with 3-step feature breakdown.
- **Create (`src/pages/Create.jsx`):** Selects USDC/USDT, inputs amount, selects expiry, generates secure claim seed, and provides copy/share URL.
- **Claim (`src/pages/Claim.jsx`):** Extracts hex seed from URL query, parses into UUID, displays countdown timer, handles claim flow.
- **Dashboard (`src/pages/Dashboard.jsx`):** Fetches active/claimed/expired links from on-chain data (with `localStorage` fallback).

### 4. On-Chain Integration (`src/hooks/usePaylink.js`)
- **Status:** Fully wired using Anchor's JS SDK.
- **`createLink`:** Derives PDAs, validates sender ATA, and issues the `createLink` Anchor RPC.
- **`claimLink`:** Reconstructs the seed, checks for the recipient's ATA, auto-creates the recipient ATA via `createAssociatedTokenAccountInstruction` if missing, and executes the claim.
- **`reclaimLink`:** Derives PDAs and issues reclaim transaction for expired links.
- **`fetchSenderLinks`:** Uses `connection.getProgramAccounts` with a `memcmp` filter (offset 8) to fetch the connected wallet's active escrows.

---

## Technical Blockers & Hacks to be aware of
1. **Placeholder Program ID:** Because the Anchor contract is not yet deployed, `src/utils/constants.js` currently uses the Solana System Program ID (`11111111111111111111111111111111`) as a base58 placeholder. *Any attempt to execute a transaction will fail on-chain until the real program is deployed and this ID is updated.*
2. **Local Storage Fallback:** `src/utils/crypto.js` includes a `localStorage` wrapper to store created links locally so the dashboard can render mock data while the on-chain fetch fails (due to the placeholder ID).

## Next Steps (Phase 5: Polish & Deployment)
If taking over this project, the immediate next steps are:
1. **Deploy Contract:** Deploy the `paylink` program to Solana Devnet via a machine with the Solana CLI/Cargo installed.
2. **Update Program ID:** Update `PROGRAM_ID` in `app/src/utils/constants.js` with the newly deployed address.
3. **UI Polish:** Add confetti micro-animations on successful link creation/claiming.
4. **Toast Notifications:** Add UI toasts for clipboard copy actions and RPC transaction errors.
5. **Testing:** Run end-to-end testing against Devnet with actual Phantom wallet signers and devnet USDC/USDT tokens.
