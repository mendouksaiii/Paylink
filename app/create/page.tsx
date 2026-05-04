'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { TOKENS, getTokenMint, parseTokenAmount } from '@/lib/tokens';
import { EXPIRY_PRESETS, DEFAULT_EXPIRY_SECONDS } from '@/lib/constants';
import {
  generateClaimSeed,
  generateClaimUrl,
  seedToDisplayId,
  storeCreatedLink,
} from '@/lib/crypto';
import { usePaylink } from '@/hooks/usePaylink';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function Create() {
  const { connected, publicKey } = useWallet();
  const { createLink, getErrorMessage } = usePaylink();

  const [selectedToken, setSelectedToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [expirySeconds, setExpirySeconds] = useState(DEFAULT_EXPIRY_SECONDS);
  const [status, setStatus] = useState('idle'); // idle | creating | success | error
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

      // Execute on-chain transaction
      const result = await createLink({
        claimSeed: seed,
        amount: rawAmount,
        expiryTs,
        mintAddress,
      });

      // Store locally for dashboard
      storeCreatedLink(seed, {
        token: selectedToken,
        amount: rawAmount,
        expiryTs,
        sender: publicKey.toString(),
        txSignature: result.txSignature,
      });

      setClaimUrl(url);
      setTxSignature(result.txSignature);
      setStatus('success');
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#06b6d4']
      });
      toast.success('Link created successfully!');
    } catch (err) {
      console.error('Create link error:', err);
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      toast.error('Transaction failed: ' + msg);
      setStatus('error');
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function resetForm() {
    setStatus('idle');
    setAmount('');
    setClaimUrl('');
    setTxSignature('');
    setErrorMsg('');
  }

  // Success state
  if (status === 'success') {
    return (
      <div className="container container-sm text-center" style={{ paddingTop: '60px' }}>
        <div className="glass-card" style={{ padding: '40px 32px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', margin: '0 auto 20px',
          }}>
            ✅
          </div>

          <h2 style={{ marginBottom: '8px' }}>Link Created!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {amount} {selectedToken} locked in escrow
          </p>

          {/* Claim URL */}
          <div style={{
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '14px 16px', marginBottom: '16px',
            wordBreak: 'break-all', fontFamily: 'var(--font-mono)',
            fontSize: '0.8125rem', color: 'var(--accent)', textAlign: 'left',
          }}>
            {claimUrl}
          </div>

          <div className="flex gap-sm" style={{ marginBottom: '16px' }}>
            <button className="btn btn-primary w-full" onClick={copyLink}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            {typeof navigator.share === 'function' && (
              <button className="btn btn-secondary"
                onClick={() => navigator.share({
                  title: 'Paylink', text: `Claim ${amount} ${selectedToken}`, url: claimUrl,
                })}>
                Share
              </button>
            )}
          </div>

          {/* Tx link */}
          {txSignature && (
            <a
              href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              View transaction on Solana Explorer ↗
            </a>
          )}

          <div style={{
            marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.1)',
            fontSize: '0.8125rem', color: 'var(--warning)',
          }}>
            ⏰ Expires in {EXPIRY_PRESETS.find(p => p.value === expirySeconds)?.label || `${expirySeconds}s`}
          </div>

          <button className="btn btn-ghost" onClick={resetForm} style={{ marginTop: '16px' }}>
            Create Another Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container container-sm" style={{ paddingTop: '40px' }}>
      <h2 className="text-center" style={{ marginBottom: '8px' }}>Create Payment Link</h2>
      <p className="text-center" style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Send USDC or USDT to anyone via a shareable URL
      </p>

      <div className="glass-card">
        {/* Token Selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Token</label>
          <div className="flex gap-sm">
            {Object.entries(TOKENS).map(([key, t]) => (
              <button key={key} onClick={() => setSelectedToken(key)} className="btn" style={{
                flex: 1,
                background: selectedToken === key ? `${t.color}18` : 'transparent',
                border: `1px solid ${selectedToken === key ? t.color + '40' : 'var(--border)'}`,
                color: selectedToken === key ? t.color : 'var(--text-secondary)',
                fontWeight: selectedToken === key ? 600 : 400,
              }}>
                {t.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Amount</label>
          <input type="number" className="input input-lg" placeholder="0.00"
            value={amount} onChange={(e) => setAmount(e.target.value)} min="0" step="0.01" />
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>
            {selectedToken} on Solana
          </div>
        </div>

        {/* Expiry */}
        <div style={{ marginBottom: '32px' }}>
          <label style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Expires After</label>
          <div className="flex gap-xs" style={{ flexWrap: 'wrap' }}>
            {EXPIRY_PRESETS.map((preset) => (
              <button key={preset.value} onClick={() => setExpirySeconds(preset.value)} className="btn btn-sm" style={{
                background: expirySeconds === preset.value ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                border: `1px solid ${expirySeconds === preset.value ? 'rgba(0, 212, 170, 0.3)' : 'var(--border)'}`,
                color: expirySeconds === preset.value ? 'var(--accent)' : 'var(--text-secondary)',
              }}>
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action */}
        {!connected ? (
          <WalletMultiButton style={{ width: '100%', justifyContent: 'center' }} />
        ) : (
          <button className="btn btn-primary btn-lg w-full" onClick={handleCreate}
            disabled={!amount || Number(amount) <= 0 || status === 'creating'}>
            {status === 'creating' ? (
              <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span> Creating...</>
            ) : (
              `Generate ${selectedToken} Link`
            )}
          </button>
        )}

        {errorMsg && (
          <div style={{
            marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)',
            background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.1)',
            fontSize: '0.8125rem', color: 'var(--danger)',
          }}>
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}


