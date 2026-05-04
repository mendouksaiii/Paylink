import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('claims')
    .select('amount_usdc, status, expiry_ts, claim_seed, sender_pubkey')
    .eq('id', params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = Math.floor(Date.now() / 1000);
  if (data.status === 'pending' && now > data.expiry_ts) {
    return NextResponse.json({ status: 'expired' });
  }

  return NextResponse.json({
    status: data.status,
    amount: data.amount_usdc,
    claimSeed: data.claim_seed,
  });
}
