'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, getTokenMint, parseTokenAmount } from '@/lib/tokens';
import { EXPIRY_PRESETS, DEFAULT_EXPIRY_SECONDS } from '@/lib/constants';
import {
  generateClaimSeed,
  generateClaimUrl,
  seedToHex,
  storeCreatedLink,
} from '@/lib/crypto';
import { usePaylink } from '@/hooks/usePaylink';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Zap, Copy, Share2, ExternalLink, CheckCircle2, ArrowRight } from 'lucide-react';

const FADE_UP = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: 'easeOut' }
  }),
};

export default function Create() {
  const { connected, publicKey } = useWallet();
  const { createLink, getErrorMessage } = usePaylink();

  const [selectedToken, setSelectedToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [expirySeconds, setExpirySeconds] = useState(DEFAULT_EXPIRY_SECONDS);
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [claimUrl, setClaimUrl] = useState('');
  const [txSignature, setTxSignature] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const token = TOKENS[selectedToken];

  async function handleCreate() {
    if (!connected || !amount || Number(amount) <= 0) return;
    setStatus('creating');
    setErrorMsg('');
    try {
      const seed = generateClaimSeed();
      const url = generateClaimUrl(seed);
      const rawAmount = parseTokenAmount(amount, token.decimals);
      const expiryTs = Math.floor(Date.now() / 1000) + expirySeconds;
      const mintAddress = getTokenMint(selectedToken).toString();

      const result = await createLink({ claimSeed: seed, amount: rawAmount, expiryTs, mintAddress });

      const claimId = seedToHex(seed);
      await fetch('/api/create-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          senderPubkey: publicKey!.toString(),
          claimSeed: seedToHex(seed),
          amount: Number(amount),
          token: selectedToken,
          mintAddress,
          expiryTs,
          txSignature: result.txSignature,
        }),
      });

      storeCreatedLink(seed, {
        token: selectedToken,
        amount: rawAmount,
        expiryTs,
        sender: publicKey!.toString(),
        txSignature: result.txSignature,
      });

      setClaimUrl(url);
      setTxSignature(result.txSignature);
      setStatus('success');

      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#00C853', '#69F0AE', '#ffffff'] });
      toast.success('PayLink created!');
    } catch (err) {
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      toast.error('Transaction failed: ' + msg);
      setStatus('error');
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function resetForm() {
    setStatus('idle');
    setAmount('');
    setClaimUrl('');
    setTxSignature('');
    setErrorMsg('');
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Animated background orbs */}
      <div className="page-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="container container-sm" style={{ paddingTop: '48px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>

        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              {/* Success header */}
              <div className="text-center" style={{ marginBottom: '32px' }}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'rgba(0, 200, 83, 0.15)',
                    border: '2px solid rgba(0, 200, 83, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px',
                    boxShadow: '0 0 40px rgba(0, 200, 83, 0.2)',
                  }}
                >
                  <CheckCircle2 size={40} color="#00C853" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: 'white', marginBottom: '8px' }}
                >
                  PayLink Created!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                  {amount} {selectedToken} locked in escrow on Solana
                </motion.p>
              </div>

              {/* Link card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-card"
                style={{ padding: '28px', marginBottom: '16px' }}
              >
                {/* URL display */}
                <div style={{
                  background: 'rgba(0, 200, 83, 0.06)',
                  border: '1px solid rgba(0, 200, 83, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  wordBreak: 'break-all',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: '#00C853',
                  lineHeight: 1.5,
                }}>
                  {claimUrl}
                </div>

                {/* Action buttons */}
                <div className="flex gap-sm" style={{ marginBottom: '16px' }}>
                  <button
                    className={`btn btn-primary w-full pulse-glow`}
                    onClick={copyLink}
                    style={{ flex: 1 }}
                  >
                    <Copy size={16} />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  {typeof navigator.share === 'function' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => navigator.share({ title: 'PayLink', text: `Claim ${amount} ${selectedToken}`, url: claimUrl })}
                    >
                      <Share2 size={16} />
                    </button>
                  )}
                </div>

                {/* Explorer link */}
                {txSignature && (
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-sm"
                    style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', justifyContent: 'center' }}
                  >
                    <ExternalLink size={12} />
                    View on Solana Explorer
                  </a>
                )}
              </motion.div>

              {/* Expiry notice */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                style={{
                  padding: '12px 16px', borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                  fontSize: '0.8125rem', color: 'var(--warning)',
                  textAlign: 'center', marginBottom: '16px',
                }}
              >
                ⏰ Expires in {EXPIRY_PRESETS.find(p => p.value === expirySeconds)?.label}
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="btn btn-ghost w-full"
                onClick={resetForm}
              >
                Create Another Link
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <motion.div
                className="text-center"
                style={{ marginBottom: '40px' }}
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
              >
                <motion.div
                  variants={FADE_UP}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '6px 16px', borderRadius: '999px',
                    background: 'rgba(0, 200, 83, 0.1)',
                    border: '1px solid rgba(0, 200, 83, 0.25)',
                    color: '#00C853', fontSize: '0.8125rem', fontWeight: 700,
                    marginBottom: '16px',
                  }}
                >
                  <Zap size={13} /> Solana · {selectedToken}
                </motion.div>
                <motion.h1 variants={FADE_UP} style={{ color: 'white', marginBottom: '8px', fontSize: '2.25rem' }}>
                  Create a PayLink
                </motion.h1>
                <motion.p variants={FADE_UP} style={{ color: 'var(--text-secondary)' }}>
                  Lock funds in escrow. Share the link. Done.
                </motion.p>
              </motion.div>

              {/* Form card */}
              <motion.div
                className="glass-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{ padding: '36px' }}
              >
                {/* Token selector */}
                <motion.div custom={0} variants={FADE_UP} initial="hidden" animate="visible" style={{ marginBottom: '28px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Token
                  </label>
                  <div className="flex gap-sm">
                    {Object.entries(TOKENS).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedToken(key)}
                        className="btn"
                        style={{
                          flex: 1, fontSize: '1rem', fontWeight: 700, padding: '14px',
                          background: selectedToken === key ? `${t.color}18` : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${selectedToken === key ? t.color + '60' : 'rgba(255,255,255,0.08)'}`,
                          color: selectedToken === key ? t.color : 'var(--text-secondary)',
                          transition: 'all 0.2s ease',
                          boxShadow: selectedToken === key ? `0 0 20px ${t.color}20` : 'none',
                        }}
                      >
                        {t.symbol}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Amount */}
                <motion.div custom={1} variants={FADE_UP} initial="hidden" animate="visible" style={{ marginBottom: '28px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      className="input input-lg"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      style={{ paddingRight: '80px' }}
                    />
                    <div style={{
                      position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 700, pointerEvents: 'none',
                    }}>
                      {selectedToken}
                    </div>
                  </div>
                </motion.div>

                {/* Expiry */}
                <motion.div custom={2} variants={FADE_UP} initial="hidden" animate="visible" style={{ marginBottom: '36px' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Claim window
                  </label>
                  <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
                    {EXPIRY_PRESETS.map(preset => (
                      <button
                        key={preset.value}
                        onClick={() => setExpirySeconds(preset.value)}
                        className="btn btn-sm"
                        style={{
                          background: expirySeconds === preset.value ? 'rgba(0, 200, 83, 0.12)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${expirySeconds === preset.value ? 'rgba(0, 200, 83, 0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: expirySeconds === preset.value ? '#00C853' : 'var(--text-secondary)',
                          fontWeight: expirySeconds === preset.value ? 700 : 500,
                          transition: 'all 0.2s ease',
                          boxShadow: expirySeconds === preset.value ? '0 0 12px rgba(0,200,83,0.15)' : 'none',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div custom={3} variants={FADE_UP} initial="hidden" animate="visible">
                  {!connected ? (
                    <div style={{ textAlign: 'center' }}>
                      <WalletMultiButton style={{ width: '100%', justifyContent: 'center' }} />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '12px' }}>
                        Connect your Solana wallet to continue
                      </p>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-lg w-full pulse-glow"
                      onClick={handleCreate}
                      disabled={!amount || Number(amount) <= 0 || status === 'creating'}
                    >
                      {status === 'creating' ? (
                        <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} /> Creating link...</>
                      ) : (
                        <><ArrowRight size={18} /> Generate {selectedToken} Link</>
                      )}
                    </button>
                  )}

                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        marginTop: '16px', padding: '12px 16px', borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontSize: '0.875rem', color: '#ef4444',
                      }}
                    >
                      {errorMsg}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}
              >
                {['Non-custodial', 'Auto-reclaim', '< $0.001 fee'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C853' }} />
                    {item}
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
