'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, getTokenMint, parseTokenAmount } from '@/lib/tokens';
import { EXPIRY_PRESETS, DEFAULT_EXPIRY_SECONDS } from '@/lib/constants';
import { generateClaimSeed, generateClaimUrl, seedToHex, storeCreatedLink } from '@/lib/crypto';
import { usePaylink } from '@/hooks/usePaylink';
import { useBalances } from '@/hooks/useBalances';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import {
  Zap, Copy, Share2, ExternalLink,
  CheckCircle2, ArrowRight, Lock, LayoutDashboard,
} from 'lucide-react';

const FADE_UP = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.09, ease: 'easeOut' as const } }),
};

export default function Create() {
  const { connected, publicKey } = useWallet();
  const { createLink, getErrorMessage }   = usePaylink();
  const { sol, usdc, usdt, loading: balancesLoading } = useBalances();

  const [token,        setToken]        = useState('USDC');
  const [amount,       setAmount]       = useState('');
  const [expiry,       setExpiry]       = useState(DEFAULT_EXPIRY_SECONDS);
  const [status,       setStatus]       = useState<'idle'|'creating'|'success'|'error'>('idle');
  const [claimUrl,     setClaimUrl]     = useState('');
  const [txSig,        setTxSig]        = useState('');
  const [errorMsg,     setErrorMsg]     = useState('');
  const [copied,       setCopied]       = useState(false);

  const tokenMeta = TOKENS[token as keyof typeof TOKENS];

  async function handleCreate() {
    if (!connected || !amount || Number(amount) <= 0) return;
    setStatus('creating'); setErrorMsg('');
    try {
      const seed        = generateClaimSeed();
      const url         = generateClaimUrl(seed);
      const rawAmount   = parseTokenAmount(amount, tokenMeta.decimals);
      const expiryTs    = Math.floor(Date.now() / 1000) + expiry;
      const mintAddress = getTokenMint(token as 'USDC'|'USDT').toString();

      const result = await createLink({ claimSeed: seed, amount: rawAmount, expiryTs, mintAddress });

      const claimId = seedToHex(seed);
      await fetch('/api/create-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, senderPubkey: publicKey!.toString(), claimSeed: claimId, amount: Number(amount), token, mintAddress, expiryTs, txSignature: result.txSignature }),
      });

      storeCreatedLink(seed, { token, amount: rawAmount, expiryTs, sender: publicKey!.toString(), txSignature: result.txSignature });
      setClaimUrl(url); setTxSig(result.txSignature); setStatus('success');

      confetti({ particleCount: 180, spread: 100, origin: { y: 0.55 }, colors: ['#F59E0B','#FBBF24','#8B5CF6','#ffffff'] });
      toast.success('PayLink created!');
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg); toast.error('Transaction failed: ' + msg); setStatus('error');
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true); toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() { setStatus('idle'); setAmount(''); setClaimUrl(''); setTxSig(''); setErrorMsg(''); }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>

      {/* Background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%',  width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 70%)', filter: 'blur(80px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 70%)', filter: 'blur(80px)', borderRadius: '50%' }} />
      </div>

      <div className="container container-sm" style={{ paddingTop: '56px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>
        <AnimatePresence mode="wait">

          {/* ── SUCCESS STATE ── */}
          {status === 'success' ? (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
            >
              <div className="text-center" style={{ marginBottom: '36px' }}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
                  style={{
                    width: '88px', height: '88px', borderRadius: '50%',
                    background: 'rgba(16,185,129,0.12)',
                    border: '2px solid rgba(16,185,129,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 0 48px rgba(16,185,129,0.20)',
                  }}
                >
                  <CheckCircle2 size={44} color="#10B981" />
                </motion.div>
                <motion.h2 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: 0.2 }}>
                  PayLink Created!
                </motion.h2>
                <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }} style={{ color:'var(--text-secondary)', marginTop:'8px' }}>
                  {amount} {token} locked in escrow on Solana
                </motion.p>
              </div>

              {/* URL card */}
              <motion.div
                initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
                style={{
                  background: 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.20)',
                  borderRadius: '20px',
                  padding: '28px',
                  marginBottom: '16px',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'2px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.6),transparent)' }} />
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:'12px' }}>Your Payment Link</div>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  wordBreak: 'break-all',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: 'var(--gold)',
                  lineHeight: 1.6,
                }}>
                  {claimUrl}
                </div>

                <div className="flex gap-sm" style={{ marginBottom: '16px' }}>
                  <button className="btn btn-primary w-full pulse-gold" onClick={copyLink} style={{ flex:1 }}>
                    <Copy size={16} />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <button className="btn btn-ghost" onClick={() => navigator.share({ title:'PayLink', text:`Claim ${amount} ${token}`, url:claimUrl })}>
                      <Share2 size={16} />
                    </button>
                  )}
                </div>

                {txSig && (
                  <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-sm" style={{ fontSize:'0.8rem', color:'var(--text-muted)', justifyContent:'center' }}>
                    <ExternalLink size={12} />
                    View on Solana Explorer
                  </a>
                )}
              </motion.div>

              {/* Expiry badge */}
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.45 }}
                style={{ padding:'12px 16px', borderRadius:'12px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.18)', fontSize:'0.8125rem', color:'var(--gold)', textAlign:'center', marginBottom:'16px' }}>
                ⏰ Expires in {EXPIRY_PRESETS.find(p => p.value === expiry)?.label}
              </motion.div>

              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }} className="flex gap-sm">
                <button className="btn btn-ghost w-full" onClick={reset} style={{ flex:1 }}>
                  Create Another
                </button>
                <a href="/dashboard" className="btn btn-ghost w-full" style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                  <LayoutDashboard size={15} /> Dashboard
                </a>
              </motion.div>
            </motion.div>

          ) : (
            /* ── FORM STATE ── */
            <motion.div key="form" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

              {/* Header */}
              <motion.div className="text-center" style={{ marginBottom:'44px' }} initial="hidden" animate="visible" variants={{ visible:{ transition:{ staggerChildren:0.09 } } }}>
                <motion.div variants={FADE_UP} style={{ marginBottom:'14px' }}>
                  <span className="badge badge-gold" style={{ fontFamily:'var(--font-heading)', fontSize:'0.65rem', letterSpacing:'0.1em' }}>
                    <Zap size={9} /> SOLANA · {token}
                  </span>
                </motion.div>
                <motion.h1 variants={FADE_UP} style={{ fontSize:'2.25rem', marginBottom:'8px' }}>
                  Create a PayLink
                </motion.h1>
                <motion.p variants={FADE_UP} style={{ color:'var(--text-secondary)' }}>
                  Lock funds in escrow. Share the link. Done.
                </motion.p>
              </motion.div>

              {/* Form card */}
              <motion.div
                initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15, duration:0.55 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(245,158,11,0.12)',
                  borderRadius: '24px',
                  padding: '36px',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Top glow line */}
                <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)' }} />

                {/* Token picker */}
                <motion.div custom={0} variants={FADE_UP} initial="hidden" animate="visible" style={{ marginBottom:'28px' }}>
                  <label style={{ fontSize:'0.7rem', color:'var(--text-muted)', display:'block', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 }}>Token</label>
                  <div className="flex gap-sm">
                    {Object.entries(TOKENS).map(([key, t]) => (
                      <button key={key} onClick={() => setToken(key)} className="btn" style={{
                        flex:1, fontSize:'1rem', fontWeight:700, padding:'14px',
                        background: token === key ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${token === key ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        color: token === key ? 'var(--gold)' : 'var(--text-secondary)',
                        boxShadow: token === key ? '0 0 20px rgba(245,158,11,0.12)' : 'none',
                        fontFamily: 'var(--font-heading)', letterSpacing:'0.06em',
                      }}>{t.symbol}</button>
                    ))}
                  </div>
                </motion.div>

                {/* Amount */}
                <motion.div custom={1} variants={FADE_UP} initial="hidden" animate="visible" style={{ marginBottom:'28px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'10px' }}>
                    <label style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 }}>Amount</label>
                    {connected && (
                      <button
                        type="button"
                        onClick={() => {
                          const bal = token === 'USDC' ? usdc : usdt;
                          if (bal > 0) setAmount(bal.toString());
                        }}
                        style={{
                          fontSize:'0.7rem', color: 'var(--text-muted)', background:'none', border:'none',
                          cursor: 'pointer', padding: 0, fontFamily: 'var(--font-mono)',
                        }}
                      >
                        Available: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                          {balancesLoading ? '...' : (token === 'USDC' ? usdc : usdt).toFixed(2)}
                        </span> {token}
                        <span style={{ marginLeft: '6px', color: 'var(--gold)', fontSize: '0.65rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>MAX</span>
                      </button>
                    )}
                  </div>
                  <div style={{ position:'relative' }}>
                    <input
                      type="number"
                      className="input input-amount"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="0" step="0.01"
                      style={{ paddingRight:'90px' }}
                    />
                    <div style={{ position:'absolute', right:'20px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', fontSize:'1rem', fontWeight:700, pointerEvents:'none', fontFamily:'var(--font-heading)' }}>
                      {token}
                    </div>
                  </div>
                  {connected && (
                    <div style={{ marginTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      SOL balance (gas): <span style={{ color: sol > 0.01 ? 'var(--gold)' : '#EF4444', fontWeight: 700 }}>
                        {balancesLoading ? '...' : sol.toFixed(4)}
                      </span> SOL
                      {sol < 0.01 && !balancesLoading && (
                        <a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px', color: 'var(--gold)', textDecoration: 'underline' }}>
                          Get devnet SOL ↗
                        </a>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Expiry */}
                <motion.div custom={2} variants={FADE_UP} initial="hidden" animate="visible" style={{ marginBottom:'36px' }}>
                  <label style={{ fontSize:'0.7rem', color:'var(--text-muted)', display:'block', marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700 }}>Claim Window</label>
                  <div className="flex gap-xs" style={{ flexWrap:'wrap' }}>
                    {EXPIRY_PRESETS.map(preset => (
                      <button key={preset.value} onClick={() => setExpiry(preset.value)} className="btn btn-sm" style={{
                        background: expiry === preset.value ? 'rgba(245,158,11,0.10)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${expiry === preset.value ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}`,
                        color: expiry === preset.value ? 'var(--gold)' : 'var(--text-secondary)',
                        fontWeight: expiry === preset.value ? 700 : 500,
                        boxShadow: expiry === preset.value ? '0 0 14px rgba(245,158,11,0.15)' : 'none',
                      }}>{preset.label}</button>
                    ))}
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div custom={3} variants={FADE_UP} initial="hidden" animate="visible">
                  {!connected ? (
                    <div style={{ textAlign:'center' }}>
                      <WalletMultiButton style={{ width:'100%', justifyContent:'center' }} />
                      <p style={{ color:'var(--text-muted)', fontSize:'0.8125rem', marginTop:'12px' }}>Connect your Solana wallet to continue</p>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-lg w-full pulse-gold"
                      onClick={handleCreate}
                      disabled={!amount || Number(amount) <= 0 || status === 'creating'}
                    >
                      {status === 'creating' ? (
                        <><div className="spinner" style={{ width:'18px', height:'18px', borderWidth:'2px' }} /> Locking on-chain...</>
                      ) : (
                        <>Generate {token} PayLink <ArrowRight size={18} /></>
                      )}
                    </button>
                  )}

                  {errorMsg && (
                    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                      style={{ marginTop:'16px', padding:'12px 16px', borderRadius:'12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.22)', fontSize:'0.875rem', color:'#EF4444' }}>
                      {errorMsg}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              {/* Trust signals */}
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.6 }}
                style={{ display:'flex', justifyContent:'center', gap:'24px', marginTop:'24px', flexWrap:'wrap' }}>
                {[
                  { icon:<Lock size={11} />, label:'Non-custodial' },
                  { icon:<Zap size={11} />,  label:'Auto-reclaim' },
                  { icon:<CheckCircle2 size={11} />, label:'< $0.001 fee' },
                ].map(item => (
                  <div key={item.label} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.8rem', color:'var(--text-muted)' }}>
                    <span style={{ color:'var(--gold-dim)' }}>{item.icon}</span>
                    {item.label}
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
