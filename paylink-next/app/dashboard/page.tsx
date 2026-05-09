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
  XCircle, Wallet, ArrowUpRight, Undo2, LayoutDashboard,
} from 'lucide-react';

const FADE_UP = {
  hidden:  { opacity: 0, y: 18 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.055, duration: 0.42, ease: 'easeOut' as const } }),
};
const STAGGER = { hidden: { opacity:0 }, visible: { opacity:1, transition: { staggerChildren: 0.055 } } };

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

/* ── Status Badge ──────────────────────────────────────────── */
function StatusBadge({ expiryTs, claimed }: { expiryTs: number; claimed: boolean }) {
  if (claimed) return (
    <span className="badge badge-claimed" style={{ display:'flex', alignItems:'center', gap:'4px' }}>
      <CheckCircle2 size={10} /> Claimed
    </span>
  );
  if (expiryTs < Date.now() / 1000) return (
    <span className="badge badge-expired" style={{ display:'flex', alignItems:'center', gap:'4px' }}>
      <Clock size={10} /> Expired
    </span>
  );
  const diff  = expiryTs - Math.floor(Date.now() / 1000);
  const days  = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const label = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  return (
    <span className="badge badge-active" style={{ display:'flex', alignItems:'center', gap:'4px' }}>
      <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#10B981', boxShadow:'0 0 6px rgba(16,185,129,0.7)', animation:'pulseGold 2s ease-in-out infinite' }} />
      {label} left
    </span>
  );
}

/* ── Link Card ─────────────────────────────────────────────── */
function LinkCard({ link, onReclaim, index }: { link: LinkData; onReclaim: (seed: string|number[]) => Promise<void>; index: number }) {
  const [copied,     setCopied]     = useState(false);
  const [reclaiming, setReclaiming] = useState(false);

  const isExpired = !link.claimed && link.expiryTs < Date.now() / 1000;
  const seedHex   = typeof link.claimSeed === 'string' ? link.claimSeed : seedToHex(new Uint8Array(link.claimSeed));
  const claimUrl  = typeof window !== 'undefined' ? `${window.location.origin}/c?id=${seedHex}` : '';
  const token     = link.tokenInfo || { symbol:'???', decimals:6, color:'#94a3b8' };

  const tokenColor = token.symbol === 'USDC' ? '#2775CA' : token.symbol === 'USDT' ? '#26A17B' : '#94a3b8';

  async function copyLink() {
    await navigator.clipboard.writeText(claimUrl);
    setCopied(true); toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  }
  async function handleReclaim() {
    setReclaiming(true);
    try { await onReclaim(link.claimSeed); toast.success('Funds reclaimed!'); }
    catch (err: unknown) { toast.error('Reclaim failed: ' + (err instanceof Error ? err.message : 'Unknown error')); }
    setReclaiming(false);
  }

  return (
    <motion.div
      custom={index} variants={FADE_UP}
      whileHover={{ y:-3, transition:{ duration:0.15 } }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: isExpired ? '1px solid rgba(239,68,68,0.15)' : link.claimed ? '1px solid rgba(139,92,246,0.15)' : '1px solid rgba(245,158,11,0.12)',
        borderRadius: '16px',
        padding: '20px 24px',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.22s ease',
      }}
    >
      {/* Status glow line */}
      <div style={{
        position:'absolute', top:0, left:'10%', right:'10%', height:'1px',
        background: isExpired
          ? 'linear-gradient(90deg,transparent,rgba(239,68,68,0.4),transparent)'
          : link.claimed
          ? 'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)'
          : 'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)',
      }} />

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
          {/* Token badge */}
          <div style={{
            width:'46px', height:'46px', borderRadius:'12px', flexShrink:0,
            background: `${tokenColor}14`,
            border: `1px solid ${tokenColor}30`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'0.62rem', fontWeight:800, color:tokenColor,
            letterSpacing:'0.04em', fontFamily:'var(--font-heading)',
          }}>{token.symbol}</div>
          <div>
            <div style={{ fontWeight:700, fontSize:'1.1rem', color:'var(--text-primary)', fontFamily:'var(--font-heading)', letterSpacing:'0.03em' }}>
              {formatTokenAmount(link.amount, token.decimals)}{' '}
              <span style={{ color:tokenColor }}>{token.symbol}</span>
            </div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-dim)', fontFamily:'var(--font-mono)', marginTop:'2px' }}>
              {seedHex.slice(0,8)}…{seedHex.slice(-8)}
            </div>
          </div>
        </div>
        <StatusBadge expiryTs={link.expiryTs} claimed={link.claimed} />
      </div>

      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
        {!link.claimed && !isExpired && (
          <button className="btn btn-sm" onClick={copyLink} style={{
            background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)', color:'var(--gold)',
          }}>
            {copied ? <><CheckCircle2 size={12} /> Copied</> : <><Copy size={12} /> Copy Link</>}
          </button>
        )}
        {isExpired && (
          <button className="btn btn-sm" onClick={handleReclaim} disabled={reclaiming} style={{
            background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.22)', color:'var(--gold)',
          }}>
            {reclaiming ? <><div className="spinner" style={{ width:'12px', height:'12px', borderWidth:'2px' }} /> Reclaiming...</> : <><Undo2 size={12} /> Reclaim Funds</>}
          </button>
        )}
        {link.claimed && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'0.75rem', color:'var(--purple-light)' }}>
            <CheckCircle2 size={12} /> Delivered
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main Dashboard ────────────────────────────────────────── */
export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const { fetchSenderLinks, reclaimLink } = usePaylink();
  const [links,   setLinks]   = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter,  setFilter]  = useState('all');

  const loadLinks = useCallback(async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    try {
      const onChainLinks = await fetchSenderLinks();
      const enriched = onChainLinks.map((l: LinkData) => ({
        ...l,
        tokenInfo: getTokenByMint(l.mint!) || { symbol:'???', decimals:6, color:'#94a3b8' },
      }));
      enriched.sort((a: LinkData, b: LinkData) => b.expiryTs - a.expiryTs);
      setLinks(enriched);
    } catch {
      const stored = getStoredLinks().reverse().map((l: Record<string,unknown>) => ({
        ...l,
        claimSeed: l.seedHex as string,
        amount: l.amount as string || '0',
        expiryTs: l.expiryTs as number || 0,
        claimed: l.claimed as boolean || false,
        tokenInfo: { symbol:(l.token as string)||'???', decimals:6, color: l.token==='USDT' ? '#26a17b' : '#2775ca' },
      }));
      setLinks(stored as LinkData[]);
    }
    setLoading(false);
  }, [connected, publicKey, fetchSenderLinks]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  async function handleReclaim(seed: string|number[]) {
    const arr = typeof seed === 'string'
      ? new Uint8Array(seed.match(/.{1,2}/g)!.map(b => parseInt(b,16)))
      : new Uint8Array(seed);
    await reclaimLink({ claimSeed: arr });
    await loadLinks();
  }

  /* ── NOT CONNECTED ────────────────────────────────────────── */
  if (!connected) return (
    <div style={{ minHeight:'100vh', position:'relative' }}>
      <BgOrbs />
      <div className="container container-sm text-center" style={{ paddingTop:'120px', position:'relative', zIndex:1 }}>
        <motion.div
          initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(245,158,11,0.12)', borderRadius:'24px', padding:'56px 36px', backdropFilter:'blur(24px)', position:'relative', overflow:'hidden' }}
        >
          <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:'1px', background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)' }} />
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:200, damping:14, delay:0.1 }}
            style={{ width:'80px', height:'80px', borderRadius:'50%', background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', boxShadow:'0 0 48px rgba(245,158,11,0.15)' }}>
            <LayoutDashboard size={34} style={{ color:'var(--gold)' }} />
          </motion.div>
          <h2 style={{ marginBottom:'8px' }}>Dashboard</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:'28px' }}>Connect your wallet to view and manage your payment links</p>
          <WalletMultiButton style={{ margin:'0 auto' }} />
        </motion.div>
      </div>
    </div>
  );

  /* ── CONNECTED ────────────────────────────────────────────── */
  const now = Date.now() / 1000;
  const counts = {
    all:     links.length,
    active:  links.filter(l => !l.claimed && l.expiryTs > now).length,
    claimed: links.filter(l =>  l.claimed).length,
    expired: links.filter(l => !l.claimed && l.expiryTs <= now).length,
  };
  const filtered = links.filter(l => {
    if (filter === 'active')  return !l.claimed && l.expiryTs > now;
    if (filter === 'claimed') return  l.claimed;
    if (filter === 'expired') return !l.claimed && l.expiryTs <= now;
    return true;
  });

  const filterMeta = [
    { key:'all',     label:'All',     color:'var(--text-secondary)' },
    { key:'active',  label:'Active',  color:'#10B981' },
    { key:'claimed', label:'Claimed', color:'var(--purple-light)' },
    { key:'expired', label:'Expired', color:'#EF4444' },
  ];

  return (
    <div style={{ minHeight:'100vh', position:'relative' }}>
      <BgOrbs />
      <div className="container" style={{ maxWidth:'740px', paddingTop:'48px', paddingBottom:'80px', position:'relative', zIndex:1 }}>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px' }}>
          <div>
            <h2 style={{ marginBottom:'4px', display:'flex', alignItems:'center', gap:'10px' }}>
              <LayoutDashboard size={22} style={{ color:'var(--gold)' }} /> My Links
            </h2>
            <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>
              {links.length} total · <span style={{ color:'#10B981' }}>{counts.active} active</span>
            </p>
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <motion.button whileHover={{ rotate:180 }} transition={{ duration:0.4 }} className="btn btn-ghost btn-sm btn-icon" onClick={loadLinks} disabled={loading}>
              <RefreshCcw size={15} />
            </motion.button>
            <Link href="/create" className="btn btn-primary btn-sm">
              <Plus size={14} /> New Link
            </Link>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div initial="hidden" animate="visible" variants={STAGGER}
          style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'12px', marginBottom:'24px' }}>
          {[
            { label:'Total',   value:counts.all,     color:'var(--gold)',     bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.18)' },
            { label:'Active',  value:counts.active,  color:'#10B981',         bg:'rgba(16,185,129,0.08)', border:'rgba(16,185,129,0.18)' },
            { label:'Claimed', value:counts.claimed, color:'var(--purple-light)', bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.18)' },
            { label:'Expired', value:counts.expired, color:'#EF4444',         bg:'rgba(239,68,68,0.07)',  border:'rgba(239,68,68,0.15)' },
          ].map((s,i) => (
            <motion.div key={s.label} custom={i} variants={FADE_UP}
              onClick={() => setFilter(s.label.toLowerCase())}
              style={{
                background: filter === s.label.toLowerCase() ? s.bg : 'rgba(255,255,255,0.03)',
                border: `1px solid ${filter === s.label.toLowerCase() ? s.border : 'rgba(255,255,255,0.06)'}`,
                borderRadius:'14px', padding:'16px 14px', textAlign:'center', cursor:'pointer',
                transition:'all 0.22s ease',
              }}>
              <div style={{ fontSize:'1.625rem', fontWeight:900, color:s.color, lineHeight:1, marginBottom:'4px', fontFamily:'var(--font-heading)' }}>{s.value}</div>
              <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em' }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Filter tabs */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
          style={{ display:'flex', gap:'6px', marginBottom:'20px', flexWrap:'wrap' }}>
          {filterMeta.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className="btn btn-sm" style={{
              background: filter===f.key ? 'rgba(255,255,255,0.07)' : 'transparent',
              border: `1px solid ${filter===f.key ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'}`,
              color: filter===f.key ? f.color : 'var(--text-muted)',
              fontWeight: filter===f.key ? 700 : 500,
            }}>
              {f.label} {counts[f.key as keyof typeof counts] > 0 ? `(${counts[f.key as keyof typeof counts]})` : ''}
            </button>
          ))}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="text-center" style={{ padding:'60px' }}>
            <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:'linear' }}
              style={{ width:'36px', height:'36px', borderRadius:'50%', border:'3px solid rgba(245,158,11,0.15)', borderTopColor:'var(--gold)', margin:'0 auto 16px' }} />
            <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Fetching links from Solana…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'20px', padding:'56px 32px', textAlign:'center' }}>
            <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              {links.length === 0 ? <ArrowUpRight size={28} style={{ color:'var(--gold-dim)' }} /> : <XCircle size={28} style={{ color:'var(--text-dim)' }} />}
            </div>
            <p style={{ color:'var(--text-secondary)', marginBottom:'20px', fontSize:'0.9375rem' }}>
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
        <AnimatePresence>
          {!loading && filtered.length > 0 && (
            <motion.div initial="hidden" animate="visible" variants={STAGGER} style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {filtered.map((link, i) => (
                <LinkCard key={link.address || i} link={link} onReclaim={handleReclaim} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function BgOrbs() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
      <div style={{ position:'absolute', top:'-10%', right:'-5%', width:'520px', height:'520px', background:'radial-gradient(circle, rgba(245,158,11,0.09) 0%, transparent 65%)', filter:'blur(80px)', borderRadius:'50%' }} />
      <div style={{ position:'absolute', bottom:'-10%', left:'-5%', width:'460px', height:'460px', background:'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)', filter:'blur(80px)', borderRadius:'50%' }} />
    </div>
  );
}
