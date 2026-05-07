# PayLink — Setup Guide

Follow these 3 steps to get the full end-to-end payment flow working.

---

## Step 1: Create Supabase Tables

Your Supabase project is already connected (`xbkusvzgdyklbcqnfomt`). You just need to create the two tables the API routes depend on.

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (`xbkusvzgdyklbcqnfomt`)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Paste the entire contents of `paylink-next/supabase-schema.sql` into the editor
6. Click **Run**

You should see:
```
Success. No rows returned.
```

To verify, click **Table Editor** in the sidebar. You should see two tables:
- **claims** — with columns: `id`, `sender_pubkey`, `claim_seed`, `amount_usdc`, `token`, `mint_address`, `expiry_ts`, `status`, `tx_signature`, `claim_tx`, `recipient_phone_hash`, `session_token`, `created_at`, `updated_at`
- **otps** — with columns: `id`, `claim_id`, `phone_hash`, `otp_hash`, `expiry_ts`, `used`, `created_at`

✅ **Done.** Your database is ready.

---

## Step 2: Get MoonPay Sandbox Keys

MoonPay provides the off-ramp widget that lets recipients convert their USDC to local currency (NGN, USD, etc.).

1. Go to [https://dashboard.moonpay.com](https://dashboard.moonpay.com)
2. Sign up for a **developer account** (it's free for sandbox)
3. Once logged in, go to **Developers** → **API Keys**
4. You will see two keys:
   - **Publishable Key** — starts with `pk_test_`
   - **Secret Key** — starts with `sk_test_`
5. Open `paylink-next/.env.local` and replace the placeholders:

```env
NEXT_PUBLIC_MOONPAY_API_KEY=pk_test_PASTE_YOUR_KEY_HERE
MOONPAY_SECRET_KEY=sk_test_PASTE_YOUR_KEY_HERE
```

> **Note:** The publishable key is safe to expose (it's in your frontend bundle). The secret key is server-only and never leaves your backend — it's used to sign widget URLs so nobody can tamper with the transaction amount.

✅ **Done.** The MoonPay off-ramp widget will now render on the claim success screen.

---

## Step 3: Generate a Relayer Keypair

The relayer is a server-side Solana wallet that executes the on-chain `claim` instruction on behalf of recipients who don't have wallets. It needs a small SOL balance for transaction fees.

### Option A: Using Solana CLI (if installed)

```bash
solana-keygen new --outfile relayer-keypair.json --no-bip39-passphrase
```

Then convert it to base64:
```bash
# PowerShell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("relayer-keypair.json"))
```

### Option B: Using Node.js (works everywhere)

Open a terminal in `paylink-next/` and run:

```bash
node -e "const { Keypair } = require('@solana/web3.js'); const kp = Keypair.generate(); console.log('Address:', kp.publicKey.toBase58()); console.log('Private Key (base64):', Buffer.from(kp.secretKey).toString('base64'));"
```

This prints two lines:
```
Address: 7Xb3...your_address_here
Private Key (base64): a1b2c3...your_key_here
```

### Paste and Fund

1. Copy the **Private Key (base64)** line
2. Open `paylink-next/.env.local` and paste it:
```env
RELAYER_PRIVATE_KEY=a1b2c3...your_key_here
```

3. Fund the relayer with Devnet SOL (for transaction fees):
   - Go to [https://faucet.solana.com](https://faucet.solana.com)
   - Paste the **Address** from above
   - Request 2 SOL (enough for hundreds of claim transactions)

> **Important:** The relayer also needs an Associated Token Account (ATA) for USDC. This gets created automatically the first time it executes a claim — the `execute-claim` route handles this via `createAssociatedTokenAccountInstruction`.

✅ **Done.** Server-side claims will now execute on-chain.

---

## Verify Everything Works

After completing all 3 steps, restart your dev server:

```bash
cd paylink-next
npm run dev
```

Then test the full flow:

1. **Create a link** → Go to `http://localhost:3000/create`, connect Phantom, select USDC, enter an amount, and create the link
2. **Check Supabase** → Open Table Editor, look at the `claims` table — you should see a new row with status `pending`
3. **Open the claim link** → Copy the generated URL, open it in an incognito tab
4. **Enter phone** → Enter your real phone number
5. **Verify OTP** → Enter the code you receive via WhatsApp/SMS
6. **See MoonPay widget** → After verification, you should see the success screen with the MoonPay off-ramp widget
7. **Check Supabase again** → The claim row should now show status `claimed` and a `claim_tx` hash

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Claim page shows "Something went wrong" | Supabase tables don't exist | Run Step 1 |
| MoonPay widget is blank/missing | No API key | Run Step 2 |
| "Claim recorded (simulated mode)" in console | No relayer key | Run Step 3 |
| OTP never arrives | Twilio sandbox numbers | Join the Twilio sandbox: text "join <sandbox-word>" to the WhatsApp number |
| "Insufficient funds" on claim | Relayer has no SOL | Fund it at faucet.solana.com |
| Create tx fails | Phantom wallet has no Devnet USDC | Get Devnet USDC from a faucet or mint test tokens |
