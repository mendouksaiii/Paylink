import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/create-claim
 *
 * Called by the Create page AFTER the on-chain createLink tx succeeds.
 * Inserts a row into the Supabase `claims` table so the recipient's
 * claim page can look it up via /api/claim/[id].
 */
export async function POST(req: NextRequest) {
  try {
    const {
      claimId,
      senderPubkey,
      claimSeed,
      amount,
      token,
      mintAddress,
      expiryTs,
      txSignature,
    } = await req.json();

    // Validate required fields
    if (!claimId || !senderPubkey || !claimSeed || !amount || !expiryTs) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('claims').insert({
      id: claimId,
      sender_pubkey: senderPubkey,
      claim_seed: claimSeed,
      amount_usdc: amount,
      token: token || 'USDC',
      mint_address: mintAddress,
      expiry_ts: expiryTs,
      status: 'pending',
      tx_signature: txSignature,
    });

    if (error) {
      console.error('Supabase insert error:', error);
      // If it's a duplicate, that's fine — idempotent
      if (error.code === '23505') {
        return NextResponse.json({ ok: true, duplicate: true });
      }
      return NextResponse.json(
        { error: 'Failed to save claim' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('create-claim error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
