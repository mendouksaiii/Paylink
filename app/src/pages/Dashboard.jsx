import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getStoredLinks, seedToHex } from '../utils/crypto';
import { formatTokenAmount, getTokenByMint } from '../utils/tokens';
import { usePaylink } from '../hooks/usePaylink';
import { toast } from 'sonner';

function StatusBadge({ expiryTs, claimed }) {
  if (claimed) return <span className="badge badge-claimed">Claimed</span>;
  if (expiryTs < Date.now() / 1000) return <span className="badge badge-expired">Expired</span>;
  const diff = expiryTs - Math.floor(Date.now() / 1000);
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const timeLabel = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  return <span className="badge badge-active">Active · {timeLabel}</span>;
}

function LinkCard({ link, onReclaim }) {
  const [copied, setCopied] = useState(false);
  const [reclaiming, setReclaiming] = useState(false);
  const isExpired = !link.claimed && link.expiryTs < Date.now() / 1000;
  const seedHex = typeof link.claimSeed === 'string' ? link.claimSeed : seedToHex(new Uint8Array(link.claimSeed));
  const claimUrl = `${window.location.origin}/c?id=${seedHex}`;
  const token = link.tokenInfo || { symbol: '???', decimals: 6, color: '#94a3b8' };

  async function copyLink() {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReclaim() {
    setReclaiming(true);
    try {
      await onReclaim(link.claimSeed);
      toast.success('Funds reclaimed successfully!');
    } catch (err) {
      console.error('Reclaim failed:', err);
      toast.error('Reclaim failed: ' + (err.message || 'Unknown error'));
    }
    setReclaiming(false);
  }

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
        <div className="flex items-center gap-sm">
          <span style={{
            width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
            background: `${token.color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: token.color,
          }}>
            {token.symbol}
          </span>
          <div>
            <div style={{ fontWeight: 600, fontSize: '1.0625rem' }}>
              {formatTokenAmount(link.amount, token.decimals)} {token.symbol}
            </div>
            <div className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {seedHex.slice(0, 8)}...{seedHex.slice(-8)}
            </div>
          </div>
        </div>
        <StatusBadge expiryTs={link.expiryTs} claimed={link.claimed} />
      </div>

      <div className="flex gap-xs">
        {!link.claimed && !isExpired && (
          <button className="btn btn-ghost btn-sm" onClick={copyLink}>
            {copied ? '✓ Copied' : '📋 Copy Link'}
          </button>
        )}
        {isExpired && (
          <button
            className="btn btn-sm"
            onClick={handleReclaim}
            disabled={reclaiming}
            style={{
              background: 'rgba(245,158,11,0.08)', color: 'var(--warning)',
              border: '1px solid rgba(245,158,11,0.15)',
            }}
          >
            {reclaiming ? 'Reclaiming...' : '↩ Reclaim Funds'}
          </button>
        )}
        {link.claimed && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Funds delivered ✓
          </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const { fetchSenderLinks, reclaimLink, getErrorMessage } = usePaylink();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadLinks = useCallback(async () => {
    if (!connected || !publicKey) return;
    setLoading(true);

    try {
      // Fetch from chain
      const onChainLinks = await fetchSenderLinks();

      // Enrich with token info
      const enriched = onChainLinks.map(link => ({
        ...link,
        tokenInfo: getTokenByMint(link.mint) || { symbol: '???', decimals: 6, color: '#94a3b8' },
      }));

      // Sort by expiry descending (newest first)
      enriched.sort((a, b) => b.expiryTs - a.expiryTs);
      setLinks(enriched);
    } catch (err) {
      console.error('Failed to load links:', err);
      // Fallback to localStorage
      const stored = getStoredLinks().reverse().map(link => ({
        ...link,
        claimSeed: link.seedHex,
        tokenInfo: { symbol: link.token || '???', decimals: 6, color: link.token === 'USDT' ? '#26a17b' : '#2775ca' },
      }));
      setLinks(stored);
    }

    setLoading(false);
  }, [connected, publicKey, fetchSenderLinks]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function handleReclaim(claimSeed) {
    const seed = typeof claimSeed === 'string'
      ? new Uint8Array(claimSeed.match(/.{1,2}/g).map(b => parseInt(b, 16)))
      : new Uint8Array(claimSeed);

    await reclaimLink({ claimSeed: seed });
    // Refresh after reclaim
    await loadLinks();
  }

  if (!connected) {
    return (
      <div className="container container-sm text-center" style={{ paddingTop: '80px' }}>
        <div className="glass-card" style={{ padding: '48px 32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔗</div>
          <h2 style={{ marginBottom: '8px' }}>My Payment Links</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Connect your wallet to view your created links
          </p>
          <WalletMultiButton style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  const now = Date.now() / 1000;
  const filtered = links.filter(l => {
    if (filter === 'active') return !l.claimed && l.expiryTs > now;
    if (filter === 'claimed') return l.claimed;
    if (filter === 'expired') return !l.claimed && l.expiryTs <= now;
    return true;
  });

  const counts = {
    all: links.length,
    active: links.filter(l => !l.claimed && l.expiryTs > now).length,
    claimed: links.filter(l => l.claimed).length,
    expired: links.filter(l => !l.claimed && l.expiryTs <= now).length,
  };

  return (
    <div className="container" style={{ maxWidth: '720px', paddingTop: '40px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <h2>My Links</h2>
        <div className="flex gap-sm">
          <button className="btn btn-ghost btn-sm" onClick={loadLinks} disabled={loading}>
            {loading ? '↻' : '↻ Refresh'}
          </button>
          <Link to="/create" className="btn btn-primary btn-sm">+ Create New</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-xs" style={{ marginBottom: '24px' }}>
        {['all', 'active', 'claimed', 'expired'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="btn btn-sm" style={{
            background: filter === f ? 'rgba(0,212,170,0.1)' : 'transparent',
            border: `1px solid ${filter === f ? 'rgba(0,212,170,0.3)' : 'var(--border)'}`,
            color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
            textTransform: 'capitalize',
          }}>
            {f} {counts[f] > 0 ? `(${counts[f]})` : ''}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center" style={{ padding: '40px' }}>
          <div className="spinner spinner-lg" style={{ margin: '0 auto 12px' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Fetching your links from Solana...</p>
        </div>
      )}

      {/* Links List */}
      {!loading && filtered.length === 0 && (
        <div className="glass-card text-center" style={{ padding: '48px 32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
          <p style={{ color: 'var(--text-secondary)' }}>
            {links.length === 0 ? 'No payment links yet. Create your first one!' : `No ${filter} links found.`}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-sm">
          {filtered.map((link, i) => (
            <LinkCard key={link.address || i} link={link} onReclaim={handleReclaim} />
          ))}
        </div>
      )}
    </div>
  );
}
