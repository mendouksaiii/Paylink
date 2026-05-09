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
  XCircle, Clock, Loader2, RefreshCcw, ArrowRight, Sparkles,
} from 'lucide-react';

type Step = 'loading'|'landing'|'phone'|'otp'|'success'|'claimed'|'expired'|'error';
type Channel = 'whatsapp'|'sms';

const SLIDE = {
  hidden:  { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22,1,0.36,1] as [number,number,number,number] } },
  exit:    { opacity: 0, x: -28, transition: { duration: 0.22 } },
};
const FADE_UP = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

const STEPS_META = [
  { id: 'phone',   label: 'Phone',  icon: <Phone   size={12} /> },
  { id: 'otp',     label: 'Verify', icon: <KeyRound size={12} /> },
  { id: 'success', label: 'Claim',  icon: <Sparkles size={12} /> },
];

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="spinner spinner-lg" />
      </div>
    }>
      <ClaimPageInner />
    </Suspense>
  );
}

function ClaimPageInner() {
  const searchParams = useSearchParams();
  const claimId      = searchParams.get('id') || '';

  const [step,         setStep]         = useState<Step>('loading');
  const [amount,       setAmount]       = useState(0);
  const [token,        setToken]        = useState('USDC');
  const [phone,        setPhone]        = useState('');
  const [countryCode,  setCountryCode]  = useState('+234');
  const [otp,          setOtp]          = useState('');
  const [channel,      setChannel]      = useState<Channel>('whatsapp');
  const [sessionToken, setSessionToken] = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!claimId) { setStep('error'); return; }
    fetch(`/api/claim/${claimId}`)
      .then(r => r.json())
      .then(data => {
        if (data.status === 'claimed' || data.status === 'verified') setStep('claimed');
        else if (data.status === 'expired') setStep('expired');
        else if (data.error) setStep('error');
        else { setAmount(data.amount); setToken(data.token || 'USDC'); setStep('landing'); }
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
      const res  = await fetch('/api/send-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, claimId, countryCode }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not send code.'); return; }
      setChannel(data.channel); setStep('otp'); setResendCooldown(30);
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  }, [phone, claimId, countryCode]);

  const handleVerifyOtp = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/verify-otp', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ phone, otp, claimId, countryCode }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Incorrect code.'); setOtp(''); return; }
      setSessionToken(data.sessionToken);

      const claimRes  = await fetch('/api/execute-claim', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ claimId, sessionToken: data.sessionToken }) });
      const claimData = await claimRes.json();
      if (!claimRes.ok) console.error('On-chain claim failed:', claimData.error);

      setStep('success');
      confetti({ particleCount: 220, spread: 110, origin: { y: 0.58 }, colors: ['#F59E0B','#FBBF24','#8B5CF6','#10B981','#ffffff'] });
    } catch { setError('Network error. Try again.'); }
    finally { setLoading(false); }
  }, [phone, otp, claimId, countryCode]);

  /* ── STATE SCREENS ───────────────────────────────────────── */
  if (step === 'loading') return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
      <BackgroundOrbs />
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:'linear' }}
        style={{ width:'44px', height:'44px', borderRadius:'50%', border:'3px solid rgba(245,158,11,0.15)', borderTopColor:'var(--gold)' }} />
    </div>
  );

  if (step === 'claimed') return <StateScreen icon={<CheckCircle2 size={44} color="#8B5CF6" />} title="Already Claimed" message="This payment link has already been claimed." color="var(--purple)" />;
  if (step === 'expired') return <StateScreen icon={<Clock size={44} color="var(--gold)" />} title="Link Expired" message="This payment link has expired. Contact the sender for a new one." color="var(--gold)" />;
  if (step === 'error')   return <StateScreen icon={<XCircle size={44} color="#EF4444" />} title="Link Not Found" message="This link may be invalid or has already been used." color="#EF4444" />;

  /* ── MAIN FLOW ───────────────────────────────────────────── */
  const stepIdx = ['phone','otp','success'].indexOf(step);

  return (
    <div style={{ minHeight:'100vh', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 16px' }}>
      <BackgroundOrbs />

      <div style={{ width:'100%', maxWidth:'440px', position:'relative', zIndex:1 }}>

        {/* Amount hero */}
        <AnimatePresence>
          {step !== 'success' && (
            <motion.div
              initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, scale:0.9 }}
              className="text-center" style={{ marginBottom:'36px' }}
            >
              <motion.div
                animate={{ scale:[1,1.03,1] }} transition={{ repeat:Infinity, duration:3.5, ease:'easeInOut' }}
                style={{ marginBottom:'10px' }}
              >
                <span style={{ fontSize:'clamp(2.5rem,8vw,4rem)', fontWeight:900, color:'var(--text-primary)', fontFamily:'var(--font-heading)', letterSpacing:'0.04em' }}>
                  {amount.toLocaleString()}
                </span>
                {' '}
                <span style={{ fontSize:'clamp(1.5rem,5vw,2.5rem)', fontWeight:800, color:'var(--gold)', fontFamily:'var(--font-heading)' }}>
                  {token}
                </span>
              </motion.div>
              <p style={{ color:'var(--text-secondary)', fontSize:'1rem' }}>Someone sent you money — claim it now</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step progress */}
        {step !== 'landing' && step !== 'success' && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginBottom:'24px' }}>
            {STEPS_META.map((s, i) => {
              const isActive = i === stepIdx;
              const isDone   = i < stepIdx;
              return (
                <div key={s.id} style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <div style={{
                    display:'flex', alignItems:'center', gap:'5px',
                    padding:'4px 12px', borderRadius:'999px', fontSize:'0.725rem', fontWeight:700,
                    background:   isDone ? 'rgba(16,185,129,0.12)'  : isActive ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${isDone ? 'rgba(16,185,129,0.35)' : isActive ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    color:   isDone ? '#10B981'  : isActive ? 'var(--gold)' : 'var(--text-muted)',
                    transition:'all 0.3s ease',
                  }}>{s.icon} {s.label}</div>
                  {i < STEPS_META.length - 1 && (
                    <div style={{ width:'18px', height:'1px', background: i < stepIdx ? '#10B981' : 'rgba(255,255,255,0.12)', transition:'background 0.4s' }} />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* Main card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(245,158,11,0.12)',
          borderRadius: '24px',
          padding: '36px',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top gold line */}
          <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)' }} />

          <AnimatePresence mode="wait">

            {/* LANDING */}
            {step === 'landing' && (
              <motion.div key="landing" variants={SLIDE} initial="hidden" animate="visible" exit="exit">
                <h2 style={{ textAlign:'center', marginBottom:'8px', fontSize:'1.5rem' }}>You have a payment</h2>
                <p style={{ color:'var(--text-secondary)', textAlign:'center', marginBottom:'32px', fontSize:'0.9375rem' }}>
                  Verify your phone to claim {amount} {token}
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px' }}>
                  {[
                    { icon:<ShieldCheck size={17} style={{ color:'#10B981' }} />, text:'Secured by Solana smart contract', bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.18)' },
                    { icon:<Phone size={17} style={{ color:'var(--purple-light)' }} />, text:'Claim with just your phone number', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.18)' },
                    { icon:<Sparkles size={17} style={{ color:'var(--gold)' }} />, text:'No wallet or app required', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.18)' },
                  ].map((item, i) => (
                    <motion.div key={i} custom={i} variants={FADE_UP} initial="hidden" animate="visible"
                      style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderRadius:'12px', background:item.bg, border:`1px solid ${item.border}` }}>
                      {item.icon}
                      <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)' }}>{item.text}</span>
                    </motion.div>
                  ))}
                </div>
                <button className="btn btn-primary btn-lg w-full pulse-gold" onClick={() => setStep('phone')}>
                  Claim {amount} {token} <ArrowRight size={17} />
                </button>
              </motion.div>
            )}

            {/* PHONE */}
            {step === 'phone' && (
              <motion.div key="phone" variants={SLIDE} initial="hidden" animate="visible" exit="exit">
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Phone size={19} style={{ color:'var(--purple-light)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize:'1.125rem' }}>Enter your phone</h3>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>We&apos;ll send a verification code</p>
                  </div>
                </div>

                <PhoneInput value={phone} countryCode={countryCode} onValueChange={setPhone} onCountryChange={setCountryCode} />
                {error && <ErrorBanner message={error} />}

                <button className="btn btn-primary btn-lg w-full" onClick={handleSendOtp} disabled={!phone || loading} style={{ marginTop:'20px' }}>
                  {loading ? <><div className="spinner" style={{ width:'17px', height:'17px', borderWidth:'2px' }} /> Sending...</> : <>Send Code <ArrowRight size={17} /></>}
                </button>
              </motion.div>
            )}

            {/* OTP */}
            {step === 'otp' && (
              <motion.div key="otp" variants={SLIDE} initial="hidden" animate="visible" exit="exit">
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <KeyRound size={19} style={{ color:'var(--gold)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize:'1.125rem' }}>Enter your code</h3>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>
                      Sent via {channel === 'whatsapp' ? 'WhatsApp' : 'SMS'} to {countryCode} {phone}
                    </p>
                  </div>
                </div>

                <OtpInput value={otp} onChange={setOtp} />
                {error && <ErrorBanner message={error} />}

                <button className="btn btn-primary btn-lg w-full" onClick={handleVerifyOtp} disabled={otp.length < 6 || loading} style={{ marginTop:'20px' }}>
                  {loading ? <><div className="spinner" style={{ width:'17px', height:'17px', borderWidth:'2px' }} /> Verifying...</> : <><CheckCircle2 size={17} /> Verify & Claim</>}
                </button>

                <div style={{ display:'flex', justifyContent:'space-between', marginTop:'14px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setStep('phone'); setOtp(''); setError(''); }}>
                    ← Change number
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setOtp(''); setError(''); handleSendOtp(); }}
                    disabled={resendCooldown > 0} style={{ color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--gold)' }}>
                    <RefreshCcw size={12} />
                    {resendCooldown > 0 ? `${resendCooldown}s` : 'Resend'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* SUCCESS */}
            {step === 'success' && (
              <motion.div key="success" initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}>
                <div className="text-center" style={{ marginBottom:'28px' }}>
                  <motion.div
                    initial={{ scale:0, rotate:-180 }} animate={{ scale:1, rotate:0 }}
                    transition={{ type:'spring', stiffness:220, damping:14, delay:0.1 }}
                    style={{ width:'88px', height:'88px', borderRadius:'50%', background:'rgba(16,185,129,0.12)', border:'2px solid rgba(16,185,129,0.35)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 0 60px rgba(16,185,129,0.22)' }}
                  >
                    <CheckCircle2 size={44} color="#10B981" />
                  </motion.div>
                  <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.22 }}>
                    <h2 style={{ marginBottom:'6px' }}>You&apos;re verified!</h2>
                    <p style={{ color:'var(--text-secondary)', marginBottom:'4px' }}>
                      {amount.toLocaleString()} {token} is being released
                    </p>
                    <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem' }}>
                      Convert to local currency with the widget below
                    </p>
                  </motion.div>
                </div>
                <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
                  <MoonpayWidget amount={amount} sessionToken={sessionToken} />
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        {(step === 'phone' || step === 'otp') && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.4 }}
            style={{ textAlign:'center', marginTop:'20px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <ShieldCheck size={12} style={{ color:'var(--text-dim)' }} />
            <span style={{ fontSize:'0.73rem', color:'var(--text-dim)' }}>
              Non-custodial · Audited smart contract · Phone-verified
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ────────────────────────────────────────────────── */
function BackgroundOrbs() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
      <div style={{ position:'absolute', top:'-15%', right:'-8%', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 65%)', filter:'blur(80px)', borderRadius:'50%' }} />
      <div style={{ position:'absolute', bottom:'-15%', left:'-8%', width:'450px', height:'450px', background:'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)', filter:'blur(80px)', borderRadius:'50%' }} />
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
      style={{ marginTop:'12px', padding:'10px 14px', borderRadius:'10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', fontSize:'0.8125rem', color:'#EF4444' }}>
      {message}
    </motion.div>
  );
}

function StateScreen({ icon, title, message, color }: { icon: React.ReactNode; title: string; message: string; color: string }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative' }}>
      <BackgroundOrbs />
      <motion.div
        initial={{ opacity:0, scale:0.92 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.45 }}
        style={{ maxWidth:'380px', width:'100%', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:'24px', padding:'48px 36px', backdropFilter:'blur(24px)', textAlign:'center', position:'relative', zIndex:1 }}
      >
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ type:'spring', stiffness:200, damping:14, delay:0.1 }}
          style={{ width:'80px', height:'80px', borderRadius:'50%', background:`rgba(255,255,255,0.05)`, border:`1px solid rgba(255,255,255,0.10)`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}
        >
          {icon}
        </motion.div>
        <h3 style={{ marginBottom:'8px' }}>{title}</h3>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.9375rem' }}>{message}</p>
      </motion.div>
    </div>
  );
}
