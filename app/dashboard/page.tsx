'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredLinks, seedToHex } from '@/lib/crypto';
import { formatTokenAmount, getTokenByMint } from '@/lib/tokens';
import { usePaylink } from '@/hooks/usePaylink';
import { toast } from 'sonner';
import {
  Plus, RefreshCcw, Copy, CheckCircle2, Clock,
  XCircle, Wallet, ExternalLink, ArrowUpRight, Undo2
} from 'lucide-react';

const FADE_UP = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: 'easeOut' }
  }),
};

const STAGGER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

interface LinkData {
  address?: string;
  claimSeed: string | number[];
  amount: string | number;
  expiryTs: number;
  claimed: boolean;
  mint?: string;
  token?: string;
  seedHex?: string;
  tokenInfo?: { symbol: string; decimals: number; color: string };
}

function StatusBadge({ expiryTs, claimed }: { expiryTs: number; claimed: boolean }) {
  if (claimed) return (
    <span className="badge badge-claimed" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <CheckCircle2 size={11} /> Claimed
    </span>
  );
  if (expiryTs < Date.now() / 1000) return (
    <span className="badge badge-expired" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Clock size={11} /> Expired
    </span>
  );
  const diff = expiryTs - Math.floor(Date.now() / 1000);
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const timeLabel = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  return (
    <span className="badge badge-active" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C853', animation: 'pulseGlow 2s ease-in-out infinite' }} />
      {timeLabel} left
    </span>
  );
}

function LinkCard({ link, onReclaim, index }: { link: LinkData; onReclaim: (seed: string | number[]) => Promise<void>; index: number }) {
  const [copied, setCopied] = useState(false);
  const [reclaiming, setReclaiming] = useState(false);
  const isExpired = !link.claimed && link.expiryTs < Date.now() / 1000;
  const seedHex = typeof link.claimSeed === 'string' ? link.claimSeed : seedToHex(new Uint8Array(link.claimSeed));
  const claimUrl = typeof window !== 'undefined' ? `${window.location.origin}/c?id=${seedHex}` : '';
  const token = link.tokenInfo || { symbol: '???', decimals: 6, color: '#94a3b8' };

  async function copyLink() {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleReclaim() {
    setReclaiming(true);
    try {
      await onReclaim(link.claimSeed);
      toast.success('Funds reclaimed!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error('Reclaim failed: ' + message);
    }
    setReclaiming(false);
  }

  return (
    <motion.div
      custom={index}
      variants={FADE_UP}
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="glass-card"
      style={{ padding: '20px 24px' }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
        <div className="flex items-center gap-md">
          {/* Token icon */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: `${token.color}12`,
            border: `1px solid ${token.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 800, color: token.color,
            letterSpacing: '0.03em',
          }}>
            {token.symbol}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'white' }}>
              {formatTokenAmount(link.amount, token.decimals)} <span style={{ color: token.color }}>{token.symbol}</span>
            </div>
            <div className="text-mono" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              {seedHex.slice(0, 8)}…{seedHex.slice(-8)}
            </div>
          </div>
        </div>
        <StatusBadge expiryTs={link.expiryTs} claimed={link.claimed} />
      </div>

      <div className="flex gap-xs items-center">
        {!link.claimed && !isExpired && (
          <button
            className="btn btn-sm"
            onClick={copyLink}
            style={{
              background: 'rgba(0, 200, 83, 0.08)',
              border: '1px solid rgba(0, 200, 83, 0.2)',
              color: '#00C853',
            }}
          >
            {copied ? <><CheckCircle2 size={13} /> Copied</> : <><Copy size={13} /> Copy Link</>}
          </button>
        )}
        {isExpired && (
          <button
            className="btn btn-sm"
            onClick={handleReclaim}
            disabled={reclaiming}
            style={{
              background: 'rgba(245,158,11,0.08)', color: 'var(--warning)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            {reclaiming ? <><RefreshCcw size={13} className="spin-icon" /> Reclaiming...</> : <><Undo2 size={13} /> Reclaim</>}
          </button>
        )}
        {link.claimed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={13} color="#10b981" /> Delivered
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const { fetchSenderLinks, reclaimLink } = usePaylink();
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadLinks = useCallback(async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    try {
      const onChainLinks = await fetchSenderLinks();
      const enriched = onChainLinks.map((link: LinkData) => ({
        ...link,
        tokenInfo: getTokenByMint(link.mint!) || { symbol: '???', decimals: 6, color: '#94a3b8' },
      }));
      enriched.sort((a: LinkData, b: LinkData) => b.expiryTs - a.expiryTs);
      setLinks(enriched);
    } catch {
      const stored = getStoredLinks().reverse().map((link: Record<string, unknown>) => ({
        ...link,
        claimSeed: link.seedHex as string,
        amount: link.amount as string || '0',
        expiryTs: link.expiryTs as number || 0,
        claimed: link.claimed as boolean || false,
        tokenInfo: {
          symbol: (link.token as string) || '???',
          decimals: 6,
          color: link.token === 'USDT' ? '#26a17b' : '#2775ca',
        },
      }));
      setLinks(stored);
    }
    setLoading(false);
  }, [connected, publicKey, fetchSenderLinks]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function handleReclaim(claimSeed: string | number[]) {
    const seed = typeof claimSeed === 'string'
      ? new Uint8Array(claimSeed.match(/.{1,2}/g)!.map(b => parseInt(b, 16)))
      : new Uint8Array(claimSeed);
    await reclaimLink({ claimSeed: seed });
    await loadLinks();
  }

  // ── NOT CONNECTED ────────────────────────────────────────
  if (!connected) {
    return (
      <div style={{ minHeight: '100vh', position: 'relative' }}>
        <div className="page-orbs"><div className="orb orb-1" /><div className="orb orb-2" /></div>
        <div className="container container-sm text-center" style={{ paddingTop: '120px', position: 'relative', zIndex: 1 }}>
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ padding: '56px 36px' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'rgba(0, 200, 83, 0.1)',
                border: '2px solid rgba(0, 200, 83, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 40px rgba(0, 200, 83, 0.15)',
              }}
            >
              <Wallet size={32} color="#00C853" />
            </motion.div>
            <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ color: 'white', marginBottom: '8px' }}>
              Dashboard
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>
              Connect your wallet to view and manage your payment links
            </motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
              <WalletMultiButton style={{ margin: '0 auto' }} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── CONNECTED ─────────────────────────────────────────────
  const now = Date.now() / 1000;
  const filtered = links.filter(l => {
    if (filter === 'active') return !l.claimed && l.expiryTs > now;
    if (filter === 'claimed') return l.claimed;
    if (filter === 'expired') return !l.claimed && l.expiryTs <= now;
    return true;
  });

  const counts: Record<string, number> = {
    all: links.length,
    active: links.filter(l => !l.claimed && l.expiryTs > now).length,
    claimed: links.filter(l => l.claimed).length,
    expired: links.filter(l => !l.claimed && l.expiryTs <= now).length,
  };

  const filterColors: Record<string, string> = {
    all: '#00C853',
    active: '#00C853',
    claimed: '#10b981',
    expired: '#ef4444',
  };

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="page-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="container" style={{ maxWidth: '720px', paddingTop: '40px', paddingBottom: '80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
          style={{ marginBottom: '28px' }}
        >
          <div>
            <h2 style={{ color: 'white', marginBottom: '4px' }}>My Links</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {links.length} total · {counts.active} active
            </p>
          </div>
          <div className="flex gap-sm">
            <motion.button
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.4 }}
              className="btn btn-ghost btn-sm"
              onClick={loadLinks}
              disabled={loading}
              style={{ padding: '8px' }}
            >
              <RefreshCcw size={16} />
            </motion.button>
            <Link href="/create" className="btn btn-primary btn-sm">
              <Plus size={14} /> Create
            </Link>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={STAGGER}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}
        >
          {[
            { label: 'Active', value: counts.active, color: '#00C853' },
            { label: 'Claimed', value: counts.claimed, color: '#10b981' },
            { label: 'Expired', value: counts.expired, color: '#ef4444' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              variants={FADE_UP}
              className="glass-card text-center"
              style={{ padding: '16px', cursor: 'pointer' }}
              onClick={() => setFilter(s.label.toLowerCase())}
            >
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: '4px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-xs"
          style={{ marginBottom: '20px' }}
        >
          {['all', 'active', 'claimed', 'expired'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className="btn btn-sm" style={{
              background: filter === f ? `${filterColors[f]}14` : 'transparent',
              border: `1px solid ${filter === f ? `${filterColors[f]}40` : 'rgba(255,255,255,0.06)'}`,
              color: filter === f ? filterColors[f] : 'var(--text-muted)',
              textTransform: 'capitalize',
              fontWeight: filter === f ? 700 : 500,
              transition: 'all 0.2s ease',
            }}>
              {f} {counts[f] > 0 ? `(${counts[f]})` : ''}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
            style={{ padding: '60px' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(0,200,83,0.15)', borderTopColor: '#00C853', margin: '0 auto 16px' }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>Fetching links from Solana...</p>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card text-center"
            style={{ padding: '56px 32px' }}
          >
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: 'rgba(0, 200, 83, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              {links.length === 0 ? <ArrowUpRight size={28} color="var(--text-muted)" /> : <XCircle size={28} color="var(--text-muted)" />}
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {links.length === 0 ? 'No payment links yet' : `No ${filter} links`}
            </p>
            {links.length === 0 && (
              <Link href="/create" className="btn btn-primary btn-sm">
                <Plus size={14} /> Create your first PayLink
              </Link>
            )}
          </motion.div>
        )}

        {/* Links list */}
        {!loading && filtered.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={STAGGER}
            className="flex flex-col gap-sm"
          >
            {filtered.map((link, i) => (
              <LinkCard key={link.address || i} link={link} onReclaim={handleReclaim} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
