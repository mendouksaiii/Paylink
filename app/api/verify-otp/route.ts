import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  hashPhone,
  hashOtp,
  formatPhone,
  generateSessionToken,
} from '@/lib/otp';

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, claimId, countryCode = '+234' } = await req.json();

    if (!phone || !otp || !claimId) {
      return NextResponse.json(
        { error: 'Phone, OTP, and claimId are required' },
        { status: 400 }
      );
    }

    const formattedPhone = formatPhone(phone, countryCode);

    // 1. Find active OTP record
    const { data: otpRecord, error: otpError } = await supabase
      .from('otps')
      .select('*')
      .eq('claim_id', claimId)
      .eq('phone_hash', hashPhone(formattedPhone))
      .eq('used', false)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired code. Request a new one.' },
        { status: 401 }
      );
    }

    // 2. Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (now > otpRecord.expiry_ts) {
      return NextResponse.json(
        { error: 'Code has expired. Request a new one.' },
        { status: 401 }
      );
    }

    // 3. Verify OTP hash
    if (hashOtp(otp) !== otpRecord.otp_hash) {
      return NextResponse.json({ error: 'Incorrect code.' }, { status: 401 });
    }

    // 4. Fetch claim
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: 'This link has already been claimed' },
        { status: 409 }
      );
    }

    // 5. Mark OTP used
    await supabase
      .from('otps')
      .update({ used: true })
      .eq('id', otpRecord.id);

    // 6. Generate session token — recipient uses this to access Moonpay widget
    const sessionToken = generateSessionToken(claimId, formattedPhone);

    // 7. Update claim with recipient phone hash and session token
    await supabase
      .from('claims')
      .update({
        recipient_phone_hash: hashPhone(formattedPhone),
        session_token: sessionToken,
        status: 'verified',
      })
      .eq('id', claimId);

    return NextResponse.json({
      ok: true,
      sessionToken,
      amount: claim.amount_usdc,
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
