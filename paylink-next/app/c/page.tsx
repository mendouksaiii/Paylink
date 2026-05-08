'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PhoneInput } from '@/components/PhoneInput';
import { OtpInput } from '@/components/OtpInput';
import { MoonpayWidget } from '@/components/MoonpayWidget';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ShieldCheck, Phone, KeyRound, CheckCircle2,
  XCircle, Clock, Loader2, RefreshCcw, ArrowRight, Sparkles
} from 'lucide-react';

type Step = 'loading' | 'landing' | 'phone' | 'otp' | 'success' | 'claimed' | 'expired' | 'error';
type Channel = 'whatsapp' | 'sms';

const SLIDE = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

const STEPS_META = [
  { id: 'phone', label: 'Phone', icon: <Phone size={14} /> },
  { id: 'otp', label: 'Verify', icon: <KeyRound size={14} /> },
  { id: 'success', label: 'Claim', icon: <Sparkles size={14} /> },
];

export default function ClaimPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} /></div>}>
      <ClaimPageInner />
    </Suspense>
  );
}

function ClaimPageInner() {
  const searchParams = useSearchParams();
  const claimId = searchParams.get('id') || '';

  const [step, setStep] = useState<Step>('loading');
  const [amount, setAmount] = useState(0);
  const [token, setToken] = useState('USDC');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+234');
  const [otp, setOtp] = useState('');
  const [channel, setChannel] = useState<Channel>('whatsapp');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!claimId) { setStep('error'); return; }
    fetch(`/api/claim/${claimId}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'claimed' || data.status === 'verified') setStep('claimed');
        else if (data.status === 'expired') setStep('expired');
        else if (data.error) setStep('error');
        else {
          setAmount(data.amount);
          setToken(data.token || 'USDC');
          setStep('landing');
        }
      })
      .catch(() => setStep('error'));
  }, [claimId]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleSendOtp = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, claimId, countryCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not send code.'); return; }
      setChannel(data.channel);
      setStep('otp');
      setResendCooldown(30);
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  }, [phone, claimId, countryCode]);

  const handleVerifyOtp = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, claimId, countryCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Incorrect code.'); setOtp(''); return; }
      setSessionToken(data.sessionToken);

      const claimRes = await fetch('/api/execute-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, sessionToken: data.sessionToken }),
      });
      const claimData = await claimRes.json();
      if (!claimRes.ok) console.error('On-chain claim failed:', claimData.error);

      setStep('success');
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: ['#00C853', '#69F0AE', '#ffffff', '#3b82f6'] });
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  }, [phone, otp, claimId, countryCode]);

  // ── LOADING ──────────────────────────────────────────────
  if (step === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div className="page-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(0,200,83,0.2)', borderTopColor: '#00C853' }}
      />
    </div>
  );

  // ── ERROR STATES ─────────────────────────────────────────
  if (step === 'claimed') return <StateScreen icon={<CheckCircle2 size={48} color="#00C853" />} title="Already Claimed" message="This payment link has already been claimed." color="#00C853" />;
  if (step === 'expired') return <StateScreen icon={<Clock size={48} color="#f59e0b" />} title="Link Expired" message="This payment link has expired. Contact the sender to create a new one." color="#f59e0b" />;
  if (step === 'error') return <StateScreen icon={<XCircle size={48} color="#ef4444" />} title="Link Not Found" message="This link may be invalid or has already been used." color="#ef4444" />;

  // ── MAIN FLOW ─────────────────────────────────────────────
  const stepIndex = ['phone', 'otp', 'success'].indexOf(step);

  return (
    <div style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div className="page-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>

        {/* Amount hero */}
        <AnimatePresence>
          {step !== 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
              style={{ marginBottom: '32px' }}
            >
              <motion.div
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                style={{
                  fontSize: '3.5rem', fontWeight: 900, color: 'white',
                  letterSpacing: '-0.03em', lineHeight: 1,
                  marginBottom: '8px',
                }}
              >
                {amount.toLocaleString()} <span style={{ color: '#00C853' }}>{token}</span>
              </motion.div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                Someone sent you money — claim it now
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress steps */}
        {step !== 'landing' && step !== 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}
          >
            {STEPS_META.map((s, i) => {
              const isActive = i === stepIndex;
              const isDone = i < stepIndex;
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                    background: isDone ? 'rgba(0,200,83,0.12)' : isActive ? 'rgba(0,200,83,0.18)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isDone || isActive ? 'rgba(0,200,83,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    color: isDone || isActive ? '#00C853' : 'var(--text-muted)',
                    transition: 'all 0.3s ease',
                  }}>
                    {s.icon} {s.label}
                  </div>
                  {i < STEPS_META.length - 1 && (
                    <div style={{ width: '20px', height: '1px', background: i < stepIndex ? '#00C853' : 'rgba(255,255,255,0.15)', transition: 'background 0.4s' }} />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Card */}
        <div className="glass-card" style={{ padding: '36px' }}>
          <AnimatePresence mode="wait">

            {/* LANDING */}
            {step === 'landing' && (
              <motion.div key="landing" variants={SLIDE} initial="hidden" animate="visible" exit="exit">
                <h2 style={{ color: 'white', marginBottom: '8px', textAlign: 'center' }}>You have a payment</h2>
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.9375rem' }}>
                  Verify your phone to claim {amount} {token}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                  {[
                    { icon: <ShieldCheck size={18} color="#00C853" />, text: 'Secured by Solana smart contract' },
                    { icon: <Phone size={18} color="#3b82f6" />, text: 'Claim with just your phone number' },
                    { icon: <Sparkles size={18} color="#8b5cf6" />, text: 'No wallet or app required' },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      custom={i}
                      variants={FADE_UP}
                      initial="hidden"
                      animate="visible"
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      {item.icon}
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.text}</span>
                    </motion.div>
                  ))}
                </div>
                <button className="btn btn-primary btn-lg w-full pulse-glow" onClick={() => setStep('phone')}>
                  <ArrowRight size={18} /> Claim {amount} {token}
                </button>
              </motion.div>
            )}

            {/* PHONE */}
            {step === 'phone' && (
              <motion.div key="phone" variants={SLIDE} initial="hidden" animate="visible" exit="exit">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={18} color="#3b82f6" />
                  </div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '1.125rem' }}>Enter your phone</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>We'll send you a verification code</p>
                  </div>
                </div>

                <PhoneInput
                  value={phone}
                  countryCode={countryCode}
                  onValueChange={setPhone}
                  onCountryChange={setCountryCode}
                />

                {error && <ErrorBanner message={error} />}

                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={handleSendOtp}
                  disabled={!phone || loading}
                  style={{ marginTop: '20px' }}
                >
                  {loading ? <><Loader2 size={18} className="spin-icon" /> Sending...</> : <><ArrowRight size={18} /> Send Code</>}
                </button>
              </motion.div>
            )}

            {/* OTP */}
            {step === 'otp' && (
              <motion.div key="otp" variants={SLIDE} initial="hidden" animate="visible" exit="exit">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <KeyRound size={18} color="#00C853" />
                  </div>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '1.125rem' }}>Enter your code</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      Sent via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to {countryCode} {phone}
                    </p>
                  </div>
                </div>

                <OtpInput value={otp} onChange={setOtp} />

                {error && <ErrorBanner message={error} />}

                <button
                  className="btn btn-primary btn-lg w-full"
                  onClick={handleVerifyOtp}
                  disabled={otp.length < 6 || loading}
                  style={{ marginTop: '20px' }}
                >
                  {loading ? <><Loader2 size={18} /> Verifying...</> : <><CheckCircle2 size={18} /> Verify & Claim</>}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}>
                    ← Change number
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setOtp(''); setError(''); handleSendOtp(); }}
                    disabled={resendCooldown > 0}
                    style={{ color: resendCooldown > 0 ? 'var(--text-muted)' : '#00C853' }}
                  >
                    <RefreshCcw size={13} />
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                <div className="text-center" style={{ marginBottom: '28px' }}>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      background: 'rgba(0, 200, 83, 0.12)',
                      border: '2px solid rgba(0, 200, 83, 0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 16px',
                      boxShadow: '0 0 60px rgba(0, 200, 83, 0.25)',
                    }}
                  >
                    <CheckCircle2 size={44} color="#00C853" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 style={{ color: 'white', marginBottom: '6px' }}>You're verified!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {amount.toLocaleString()} {token} is being released
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      Use the widget below to convert to local currency
                    </p>
                  </motion.div>
                </div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                  <MoonpayWidget amount={amount} sessionToken={sessionToken} />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security footer */}
        {(step === 'phone' || step === 'otp') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ textAlign: 'center', marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <ShieldCheck size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Non-custodial · Audited smart contract · Phone-verified
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* Helper components */
function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: '12px', padding: '10px 14px',
        borderRadius: '8px',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        fontSize: '0.8125rem', color: '#ef4444',
      }}
    >
      {message}
    </motion.div>
  );
}

function StateScreen({ icon, title, message, color }: { icon: React.ReactNode; title: string; message: string; color: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <div className="page-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-card text-center"
        style={{ maxWidth: '380px', width: '100%', padding: '48px 36px', position: 'relative', zIndex: 1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: `${color}12`, border: `2px solid ${color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: `0 0 40px ${color}20`,
          }}
        >
          {icon}
        </motion.div>
        <h3 style={{ color: 'white', marginBottom: '8px' }}>{title}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>{message}</p>
      </motion.div>
    </div>
  );
}
