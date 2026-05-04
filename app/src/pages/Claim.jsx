import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { extractSeedFromUrl } from '../utils/crypto';
import { getTokenByMint, formatTokenAmount } from '../utils/tokens';
import { usePaylink } from '../hooks/usePaylink';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function Claim() {
  const [searchParams] = useSearchParams();
  const { connected } = useWallet();
  const { fetchEscrow, claimLink, getErrorMessage } = usePaylink();

  const [state, setState] = useState('loading');
  const [escrowData, setEscrowData] = useState(null);
  const [seed, setSeed] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [txSignature, setTxSignature] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch escrow on mount
  useEffect(() => {
    async function load() {
      const extractedSeed = extractSeedFromUrl(searchParams);
      if (!extractedSeed) { setState('not_found'); return; }
      setSeed(extractedSeed);

      try {
        const escrow = await fetchEscrow(extractedSeed);
        if (!escrow) {
          setState('not_found');
          return;
        }

        setEscrowData(escrow);
        const token = getTokenByMint(escrow.mint);
        setTokenInfo(token || { symbol: 'Token', decimals: 6, color: '#94a3b8' });

        if (escrow.claimed) {
          setState('claimed');
        } else if (escrow.expiryTs < Date.now() / 1000) {
          setState('expired');
        } else {
          setState('ready');
        }
      } catch (err) {
        console.error('Fetch escrow error:', err);
        setState('not_found');
      }
    }
    load();
  }, [searchParams, fetchEscrow]);

  // Countdown timer
  useEffect(() => {
    if (!escrowData || state !== 'ready') return;
    const tick = () => {
      const diff = escrowData.expiryTs - Math.floor(Date.now() / 1000);
      if (diff <= 0) { setTimeRemaining('Expired'); setState('expired'); return; }
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setTimeRemaining(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [escrowData, state]);

  async function handleClaim() {
    if (!connected || !seed) return;
    setState('claiming');
    setErrorMsg('');

    try {
      const result = await claimLink({ claimSeed: seed });
      setTxSignature(result.txSignature);
      setState('success');
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#06b6d4']
      });
      toast.success('Funds claimed successfully!');
    } catch (err) {
      console.error('Claim error:', err);
      const msg = getErrorMessage(err);
      setErrorMsg(msg);
      toast.error('Claim failed: ' + msg);
      setState('ready');
    }
  }

  const amt = escrowData ? formatTokenAmount(escrowData.amount, tokenInfo?.decimals) : '—';
  const sym = tokenInfo?.symbol || 'Token';

  // Loading
  if (state === 'loading') return (
    <div className="container container-sm text-center" style={{ paddingTop: '80px' }}>
      <div className="spinner spinner-lg" style={{ margin: '0 auto 16px' }}></div>
      <p style={{ color: 'var(--text-secondary)' }}>Loading payment link...</p>
    </div>
  );

  // Not found
  if (state === 'not_found') return (
    <div className="container container-sm text-center" style={{ paddingTop: '80px' }}>
      <div className="glass-card" style={{ padding: '48px 32px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
        <h2>Invalid Link</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          This payment link is invalid, already claimed, or never existed.
        </p>
      </div>
    </div>
  );

  // Success
  if (state === 'success') return (
    <div className="container container-sm text-center" style={{ paddingTop: '80px' }}>
      <div className="glass-card" style={{ padding: '48px 32px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', margin: '0 auto 20px',
        }}>
          🎉
        </div>
        <h2 style={{ marginBottom: '8px' }}>Funds Received!</h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>{amt} {sym}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: '4px' }}>
          has been transferred to your wallet
        </p>
        {txSignature && (
          <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', marginTop: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            View transaction on Solana Explorer ↗
          </a>
        )}
      </div>
    </div>
  );

  // Ready / Claiming / Claimed / Expired
  return (
    <div className="container container-sm text-center" style={{ paddingTop: '60px' }}>
      <div className="glass-card" style={{ padding: '40px 32px' }}>
        {/* Amount display */}
        <div style={{
          padding: '32px', borderRadius: 'var(--radius-lg)',
          background: state === 'expired' || state === 'claimed' ? 'rgba(239,68,68,0.04)' : `${tokenInfo?.color}08`,
          border: `1px solid ${state === 'expired' || state === 'claimed' ? 'rgba(239,68,68,0.1)' : (tokenInfo?.color || '#94a3b8') + '15'}`,
          marginBottom: '24px',
        }}>
          <div style={{
            fontSize: '2.5rem', fontWeight: 700,
            opacity: state === 'expired' || state === 'claimed' ? 0.5 : 1,
            textDecoration: state === 'expired' || state === 'claimed' ? 'line-through' : 'none',
          }}>{amt}</div>
          <div style={{ color: tokenInfo?.color, fontWeight: 600, marginTop: '4px' }}>{sym}</div>
        </div>

        {state === 'claimed' && (
          <><span className="badge badge-claimed">Already Claimed</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>This link has already been used.</p></>
        )}

        {state === 'expired' && (
          <><span className="badge badge-expired">Expired</span>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>This link has expired.</p></>
        )}

        {(state === 'ready' || state === 'claiming') && (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '24px' }}>
              ⏰ {timeRemaining} remaining
            </p>

            {!connected ? (
              <>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>Connect your wallet to claim</p>
                <WalletMultiButton style={{ width: '100%', justifyContent: 'center' }} />
              </>
            ) : (
              <button className="btn btn-primary btn-lg w-full" onClick={handleClaim} disabled={state === 'claiming'}>
                {state === 'claiming' ? (
                  <><span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></span> Claiming...</>
                ) : `Claim ${amt} ${sym}`}
              </button>
            )}

            {errorMsg && (
              <div style={{
                marginTop: '16px', padding: '12px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)',
                fontSize: '0.8125rem', color: 'var(--danger)',
              }}>{errorMsg}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
