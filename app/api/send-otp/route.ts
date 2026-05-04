import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hashPhone, hashOtp, generateOtp, formatPhone } from '@/lib/otp';
import { sendOtp } from '@/lib/twilio';

export async function POST(req: NextRequest) {
  try {
    const { phone, claimId, countryCode = '+234' } = await req.json();

    if (!phone || !claimId) {
      return NextResponse.json(
        { error: 'Phone and claimId are required' },
        { status: 400 }
      );
    }

    // Validate claim exists and is still pending
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id, status, expiry_ts')
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
    if (claim.status !== 'pending') {
      return NextResponse.json(
        { error: 'This link has already been claimed' },
        { status: 409 }
      );
    }
    const now = Math.floor(Date.now() / 1000);
    if (now > claim.expiry_ts) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
    }

    // Invalidate any existing unused OTPs for this claim
    await supabase
      .from('otps')
      .update({ used: true })
      .eq('claim_id', claimId)
      .eq('used', false);

    // Generate and store new OTP
    const otp = generateOtp();
    const formattedPhone = formatPhone(phone, countryCode);
    const expiry = Math.floor(Date.now() / 1000) + 600; // 10 min

    const { error: insertError } = await supabase.from('otps').insert({
      claim_id: claimId,
      phone_hash: hashPhone(formattedPhone),
      otp_hash: hashOtp(otp),
      expiry_ts: expiry,
    });

    if (insertError) {
      console.error('OTP insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to generate code' },
        { status: 500 }
      );
    }

    // Send OTP
    const channel = await sendOtp(formattedPhone, otp);

    if (!channel) {
      return NextResponse.json(
        { error: 'Could not send verification code. Check the number and try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, channel });
  } catch (err) {
    console.error('send-otp error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
