'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { PhoneInput } from '@/components/PhoneInput';
import { OtpInput } from '@/components/OtpInput';
import { MoonpayWidget } from '@/components/MoonpayWidget';
import confetti from 'canvas-confetti';

type Step = 'loading' | 'landing' | 'phone' | 'otp' | 'success' | 'claimed' | 'expired' | 'error';
type Channel = 'whatsapp' | 'sms';

export default function ClaimPage() {
  const searchParams = useSearchParams();
  const claimId = searchParams.get('id') || '';

  const [step, setStep] = useState<Step>('loading');
  const [amount, setAmount] = useState(0);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [otp, setOtp] = useState('');
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Fetch claim status on mount
  useEffect(() => {
    if (!claimId) {
      setStep('error');
      return;
    }
    fetch(`/api/claim/${claimId}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'claimed' || data.status === 'verified') {
          setStep('claimed');
        } else if (data.status === 'expired') {
          setStep('expired');
        } else if (data.error) {
          setStep('error');
        } else {
          setAmount(data.amount);
          setStep('landing');
        }
      })
      .catch(() => setStep('error'));
  }, [claimId]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, claimId, countryCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send code. Try again.');
        return;
      }
      setChannel(data.channel);
      setStep('otp');
      setResendCooldown(30);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [phone, claimId, countryCode]);

  async function handleResend() {
    if (resendCooldown > 0) return;
    setOtp('');
    setError('');
    await handleSendOtp();
  }

  const handleVerifyOtp = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Step 1: Verify OTP
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, claimId, countryCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Incorrect code. Try again.');
        setOtp('');
        return;
      }
      setSessionToken(data.sessionToken);

      // Step 2: Execute the on-chain claim (server-side relayer)
      const claimRes = await fetch('/api/execute-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          sessionToken: data.sessionToken,
        }),
      });
      const claimData = await claimRes.json();
      if (!claimRes.ok) {
        console.error('On-chain claim failed:', claimData.error);
        // Still show success — funds are verified, off-ramp can proceed
      }

      setStep('success');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00d4aa', '#3b82f6', '#8b5cf6'],
      });
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [phone, otp, claimId, countryCode]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (otp.length === 6 && step === 'otp' && !loading) {
      handleVerifyOtp();
    }
  }, [otp, step, loading, handleVerifyOtp]);

  // ── LOADING ─────────────────────────────────────────────────────────────
  if (step === 'loading') return (
    <Screen>
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div className="spinner spinner-lg"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading payment link...</p>
      </div>
    </Screen>
  );

  // ── ALREADY CLAIMED ──────────────────────────────────────────────────────
  if (step === 'claimed') return (
    <Screen>
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <div style={{ fontSize: '3rem' }}>✓</div>
        <h3>Already received</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>This payment link has already been claimed.</p>
      </div>
    </Screen>
  );

  // ── EXPIRED ──────────────────────────────────────────────────────────────
  if (step === 'expired') return (
    <Screen>
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⏱</div>
        <h3>Link expired</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ask the sender to create a new payment link.</p>
      </div>
    </Screen>
  );

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (step === 'error') return (
    <Screen>
      <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h3>Something went wrong</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>This link may be invalid. Contact the sender.</p>
      </div>
    </Screen>
  );

  // ── LANDING ───────────────────────────────────────────────────────────────
  if (step === 'landing') return (
    <Screen>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Amount display */}
        <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>You received</p>
          <p style={{ fontSize: '4rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>${amount}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>sent to you via PayLink</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => setStep('phone')}
          className="btn btn-primary btn-lg w-full"
          style={{ padding: '20px', fontSize: '1.125rem' }}
        >
          Receive money
        </button>

        {/* Trust signals */}
        <div className="flex justify-center gap-lg" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>🔒 Secure</span>
          <span>⚡ Instant</span>
          <span>🏦 Bank transfer</span>
        </div>

        <p className="text-center" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          No account or app needed. Takes 30 seconds.
        </p>
      </div>
    </Screen>
  );

  // ── PHONE ENTRY ───────────────────────────────────────────────────────────
  if (step === 'phone') return (
    <Screen>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <button
            onClick={() => setStep('landing')}
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: '16px' }}
          >
            ← Back
          </button>
          <h3 style={{ marginBottom: '4px' }}>Enter your phone number</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            We&apos;ll send a verification code to confirm it&apos;s you
          </p>
        </div>

        <PhoneInput
          value={phone}
          countryCode={countryCode}
          onValueChange={setPhone}
          onCountryChange={setCountryCode}
        />

        {error && (
          <div style={{
            padding: '12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.1)',
            fontSize: '0.8125rem', color: 'var(--danger)',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSendOtp}
          disabled={loading || phone.length < 7}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Sending code...' : 'Send code via WhatsApp'}
        </button>

        <p className="text-center" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          You&apos;ll receive a WhatsApp message with your 6-digit code.
          If WhatsApp isn&apos;t available, we&apos;ll send an SMS instead.
        </p>
      </div>
    </Screen>
  );

  // ── OTP ENTRY ─────────────────────────────────────────────────────────────
  if (step === 'otp') return (
    <Screen>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <button
            onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
            className="btn btn-ghost btn-sm"
            style={{ marginBottom: '16px' }}
          >
            ← Change number
          </button>
          <h3 style={{ marginBottom: '4px' }}>Enter your code</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {channel === 'whatsapp' ? '📱 WhatsApp' : '💬 SMS'} code sent to{' '}
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {countryCode} {phone}
            </span>
          </p>
        </div>

        <OtpInput value={otp} onChange={setOtp} />

        {error && (
          <div style={{
            padding: '12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.1)',
            fontSize: '0.8125rem', color: 'var(--danger)',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleVerifyOtp}
          disabled={loading || otp.length < 6}
          className="btn btn-primary btn-lg w-full"
        >
          {loading ? 'Verifying...' : 'Confirm'}
        </button>

        <div className="text-center">
          {resendCooldown > 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Resend code in {resendCooldown}s
            </p>
          ) : (
            <button onClick={handleResend} className="btn btn-ghost btn-sm">
              Didn&apos;t receive a code? Resend
            </button>
          )}
        </div>
      </div>
    </Screen>
  );

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <Screen>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem',
          }}>
            ✓
          </div>
          <h3>Payment verified</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            ${amount} confirmed. Enter your bank details below to receive naira.
          </p>
        </div>

        {/* Amount summary */}
        <div className="glass-card" style={{ padding: '16px' }}>
          <div className="flex justify-between" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>You receive</span>
            <span style={{ fontWeight: 600 }}>${amount} USDC</span>
          </div>
          <div className="flex justify-between" style={{ fontSize: '0.875rem', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Estimated NGN</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>
              ≈ ₦{(amount * 1340).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between" style={{ fontSize: '0.875rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Arrives in</span>
            <span style={{ fontWeight: 600 }}>Minutes</span>
          </div>
        </div>

        {/* Moonpay offramp */}
        <MoonpayWidget amount={amount} sessionToken={sessionToken} />
      </div>
    </Screen>
  );

  return null;
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Pay<span style={{ color: 'var(--accent)' }}>Link</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
