'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  motion,
  useScroll, useTransform,
  useMotionValue, useSpring,
} from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  Link as LinkIcon, Send, Wallet,
  ShieldCheck, Zap, Coins, RefreshCcw,
  Briefcase, Building2, Users, ArrowRight,
  Lock, Smartphone, Globe
} from 'lucide-react';

/* ── Animation variants ─────────────────────────────────────── */
const FADE_UP = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.7, ease: 'easeOut' as const } },
};
const STAGGER = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

/* ── 3D Tilt Card ────────────────────────────────────────────── */
function TiltCard({ children, className, style }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref  = useRef<HTMLDivElement>(null);
  const x    = useMotionValue(0);
  const y    = useMotionValue(0);
  const rotX = useTransform(y, [-80, 80], [12, -12]);
  const rotY = useTransform(x, [-80, 80], [-12, 12]);
  const [mobile, setMobile] = useState(false);

  useEffect(() => { setMobile(window.innerWidth < 768); }, []);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ ...style, perspective: 1200, transformStyle: 'preserve-3d' }}
      onMouseMove={e => {
        if (mobile) return;
        const r = ref.current!.getBoundingClientRect();
        x.set(e.clientX - r.left - r.width / 2);
        y.set(e.clientY - r.top  - r.height / 2);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      whileHover={mobile ? {} : { scale: 1.025 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
    >
      <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', width: '100%', height: '100%' }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ── Floating 3D Hero Card (payment preview) ─────────────────── */
function HeroCard() {
  return (
    <motion.div
      animate={{ y: [0, -18, 0], rotateY: [0, 4, 0, -4, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: '320px',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(32px)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(245,158,11,0.12)',
        transformStyle: 'preserve-3d',
        perspective: 1000,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Card shimmer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, transparent 50%, rgba(139,92,246,0.06) 100%)',
        borderRadius: '24px', pointerEvents: 'none',
      }} />
      {/* Amount row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2775CA, #1a5c9a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: 800, color: '#fff',
          fontFamily: 'var(--font-heading)', letterSpacing: '0.05em',
          boxShadow: '0 0 16px rgba(39,117,202,0.4)',
        }}>USDC</div>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'rgba(248,250,252,0.4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Amount</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#F8FAFC', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>$250.00</div>
        </div>
      </div>
      {/* Link pill */}
      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.20)',
        borderRadius: '10px', padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(248,250,252,0.5)', fontFamily: 'var(--font-mono)' }}>paylink.app/c?id=a8f3…</span>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
      </div>
      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'rgba(248,250,252,0.35)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Expires in</div>
          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-heading)' }}>23h 47m</div>
        </div>
        <div style={{
          padding: '6px 14px',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#0A0E1A',
          letterSpacing: '0.04em',
          boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
        }}>LIVE</div>
      </div>
      {/* Glow at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)',
      }} />
    </motion.div>
  );
}

/* ── Animated mesh background particles ─────────────────────── */
function ParticleField() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const sX = useSpring(mouseX, { stiffness: 40, damping: 20 });
  const sY = useSpring(mouseY, { stiffness: 40, damping: 20 });

  useEffect(() => {
    const h = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth)  * 2 - 1);
      mouseY.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, [mouseX, mouseY]);

  const particles = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    gold:   i % 3 !== 0,
    size:   24 + (i * 7) % 72,
    x:      (i * 37) % 100,
    y:      (i * 53) % 100,
    depth:  1 + (i % 5),
    dur:    16 + (i % 12),
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {particles.map(p => {
        const px = useTransform(sX, [-1,1], [-50*p.depth, 50*p.depth]);
        const py = useTransform(sY, [-1,1], [-50*p.depth, 50*p.depth]);
        return (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              top: `${p.y}%`, left: `${p.x}%`,
              width: p.size, height: p.size,
              border: `1px solid ${p.gold ? 'rgba(245,158,11,0.25)' : 'rgba(139,92,246,0.20)'}`,
              borderRadius: p.id % 2 === 0 ? '50%' : '20%',
              opacity: 0.15 + (1/p.depth) * 0.3,
              x: px, y: py,
              boxShadow: p.gold
                ? 'inset 0 0 12px rgba(245,158,11,0.10)'
                : 'inset 0 0 12px rgba(139,92,246,0.10)',
            }}
            animate={{ rotateZ: [0, 360] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */
export default function Home() {
  const { connected } = useWallet();
  const { scrollY }   = useScroll();
  const heroY   = useTransform(scrollY, [0, 700], [0, -200]);
  const heroOp  = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>

        {/* Background FX */}
        <motion.div style={{ position: 'absolute', inset: 0, y: heroY }}>
          <ParticleField />
          {/* Deep glow orbs */}
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, transparent 65%)', filter: 'blur(60px)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 65%)', filter: 'blur(60px)', borderRadius: '50%' }} />
        </motion.div>

        {/* Scan-line grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 40%, black 30%, transparent 100%)',
        }} />

        {/* Bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to bottom, transparent, var(--bg-base))', pointerEvents: 'none' }} />

        <motion.div
          className="container"
          style={{ position: 'relative', zIndex: 10, paddingTop: '80px', paddingBottom: '80px', opacity: heroOp }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '64px', alignItems: 'center' }}>

            {/* Left: Copy */}
            <motion.div initial="hidden" animate="visible" variants={STAGGER}>

              {/* Pill badge */}
              <motion.div variants={FADE_UP} style={{ marginBottom: '28px' }}>
                <span className="badge badge-gold" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                  <Zap size={10} /> POWERED BY SOLANA
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={FADE_UP} style={{
                marginBottom: '24px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 900,
                letterSpacing: '0.03em',
                lineHeight: 1.05,
              }}>
                Send money<br />
                to{' '}
                <span style={{
                  background: 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%)',
                  backgroundSize: '200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 3s linear infinite',
                }}>anyone.</span>
                <br />
                <span style={{
                  fontSize: '0.55em',
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginTop: '8px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                }}>No wallet required.</span>
              </motion.h1>

              {/* Sub */}
              <motion.p variants={FADE_UP} style={{
                fontSize: '1.1875rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.65,
                maxWidth: '480px',
                marginBottom: '12px',
              }}>
                Lock USDC on Solana. Share a link. Your recipient claims it with just a phone number.
              </motion.p>
              <motion.p variants={FADE_UP} style={{
                fontSize: '1.25rem',
                color: 'var(--gold)',
                fontWeight: 700,
                marginBottom: '48px',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.04em',
              }}>
                One link. That&apos;s all they need.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={FADE_UP} className="flex gap-md flex-col-mobile" style={{ flexWrap: 'wrap' }}>
                {connected ? (
                  <Link href="/create" className="btn btn-primary btn-xl pulse-gold">
                    Create a PayLink <ArrowRight size={18} />
                  </Link>
                ) : (
                  <WalletMultiButton />
                )}
                <Link href="/dashboard" className="btn btn-ghost btn-xl">
                  View Dashboard
                </Link>
              </motion.div>

              <motion.div variants={FADE_UP} style={{ marginTop: '1rem', fontSize: '11px', opacity: 0.4, letterSpacing: '2px' }}>
                BUILD_MARKER: v2-pubkey-fix-{new Date().toISOString().slice(0, 10)}
              </motion.div>

              {/* Trust bar */}
              <motion.div variants={FADE_UP} style={{ marginTop: '40px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {[
                  { icon: <Lock size={13} />, text: 'Non-custodial' },
                  { icon: <Zap size={13} />, text: '400ms settlement' },
                  { icon: <Globe size={13} />, text: 'Works globally' },
                  { icon: <Smartphone size={13} />, text: 'No wallet needed' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--gold-dim)' }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: 3D Card */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.22,1,0.36,1] }}
              style={{ display: 'flex', justifyContent: 'center', perspective: 1200 }}
              className="hero-card-wrap"
            >
              <HeroCard />
            </motion.div>

          </div>
        </motion.div>
      </section>

      {/* ── BELOW FOLD ───────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>

        {/* ── STATS ──────────────────────────────────────────── */}
        <motion.section
          className="container"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={STAGGER}
          style={{ padding: '80px 0', borderBottom: '1px solid rgba(245,158,11,0.08)' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            {[
              { val: '< 400ms', label: 'Settlement Speed' },
              { val: '$0.001',  label: 'Network Fee' },
              { val: '100%',    label: 'Non-Custodial' },
              { val: '0',       label: 'Accounts Required' },
            ].map(s => (
              <motion.div key={s.label} variants={FADE_UP} className="text-center">
                <div style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 900,
                  color: 'var(--gold)',
                  marginBottom: '8px',
                  letterSpacing: '0.04em',
                  textShadow: '0 0 32px rgba(245,158,11,0.35)',
                }}>{s.val}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <motion.section
          className="container"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={STAGGER}
          style={{ padding: '120px 0' }}
        >
          <motion.div variants={FADE_UP} className="text-center" style={{ marginBottom: '72px' }}>
            <div className="badge badge-gold" style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)', fontSize: '0.65rem' }}>HOW IT WORKS</div>
            <h2 style={{ marginBottom: '16px' }}>Three steps. Millions of people.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: '500px', margin: '0 auto' }}>
              Built for the person who doesn&apos;t know what a seed phrase is — and never should have to.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              {
                step: '01', label: 'LOCK',
                icon: <LinkIcon size={26} style={{ color: 'var(--gold)' }} />,
                title: 'Create a PayLink',
                desc: 'Connect your wallet. Pick USDC or USDT. Set the amount and an expiry window. Funds lock in an audited Solana smart contract — not on our servers, never in our custody.',
                color: 'var(--gold)',
                glow: 'rgba(245,158,11,0.15)',
              },
              {
                step: '02', label: 'SEND',
                icon: <Send size={26} style={{ color: 'var(--purple-light)' }} />,
                title: 'Share the link',
                desc: 'A unique URL is generated instantly. Send it over WhatsApp, SMS, email, or a DM. No wallet address. No QR codes. No explaining what a blockchain is.',
                color: 'var(--purple-light)',
                glow: 'rgba(139,92,246,0.15)',
              },
              {
                step: '03', label: 'CLAIM',
                icon: <Wallet size={26} style={{ color: '#10B981' }} />,
                title: 'Tap. Money arrives.',
                desc: 'They open the link in any browser. Verify with a phone OTP. Funds released instantly. No app. No account. No crypto knowledge.',
                color: '#10B981',
                glow: 'rgba(16,185,129,0.15)',
              },
            ].map(item => (
              <motion.div key={item.step} variants={FADE_UP}>
                <TiltCard style={{ height: '100%' }}>
                  <div style={{
                    height: '100%',
                    background: 'var(--bg-card)',
                    border: `1px solid rgba(255,255,255,0.07)`,
                    borderRadius: '20px',
                    padding: '36px 28px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all var(--t-base)',
                  }}>
                    {/* Step number bg watermark */}
                    <div style={{
                      position: 'absolute', top: '-10px', right: '16px',
                      fontSize: '6rem', fontWeight: 900, fontFamily: 'var(--font-heading)',
                      color: item.glow, lineHeight: 1, pointerEvents: 'none',
                      WebkitTextFillColor: 'transparent',
                      WebkitTextStroke: `1px ${item.glow}`,
                    }}>{item.step}</div>
                    {/* Top glow line */}
                    <div style={{ position: 'absolute', top: 0, left: '15%', right: '15%', height: '2px', background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`, opacity: 0.5 }} />
                    {/* Icon */}
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '14px',
                      background: item.glow,
                      border: `1px solid ${item.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '20px',
                    }}>
                      {item.icon}
                    </div>
                    {/* Label */}
                    <div style={{ fontSize: '0.65rem', color: item.color, fontWeight: 800, letterSpacing: '0.12em', marginBottom: '8px' }}>
                      {item.step} / {item.label}
                    </div>
                    <h3 style={{ marginBottom: '12px', fontSize: '1.25rem', color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.7, flex: 1 }}>{item.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── WHO IT'S FOR ────────────────────────────────────── */}
        <motion.section
          className="container"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={STAGGER}
          style={{ padding: '80px 0 120px' }}
        >
          <motion.div variants={FADE_UP} className="text-center" style={{ marginBottom: '64px' }}>
            <h2 style={{ marginBottom: '12px' }}>Not built for crypto natives.<br />Built for everyone else.</h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {[
              {
                title: 'Freelancers & Remote Workers',
                desc: 'Invoice international clients without sharing a wallet address. Get paid in USDC. Convert to local currency on your terms. No wire fees.',
                icon: <Briefcase size={22} />,
                color: 'var(--gold)',
              },
              {
                title: 'Families Sending Money Home',
                desc: 'Remittances cost 6.2% globally on average. PayLink costs less than a cent. Your family gets a WhatsApp link. They claim it. Done.',
                icon: <Users size={22} />,
                color: 'var(--purple-light)',
              },
              {
                title: 'Merchants & Market Traders',
                desc: 'Accept digital payments without a POS terminal, a bank account, or a crypto wallet. One link. Any amount. Any customer.',
                icon: <Building2 size={22} />,
                color: '#10B981',
              },
            ].map(uc => (
              <motion.div key={uc.title} variants={FADE_UP}>
                <TiltCard>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '18px',
                    padding: '28px 24px',
                    display: 'flex', gap: '18px', alignItems: 'flex-start',
                  }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: `rgba(${uc.color === 'var(--gold)' ? '245,158,11' : uc.color === 'var(--purple-light)' ? '167,139,250' : '16,185,129'},0.12)`,
                      border: `1px solid rgba(${uc.color === 'var(--gold)' ? '245,158,11' : uc.color === 'var(--purple-light)' ? '167,139,250' : '16,185,129'},0.25)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: uc.color,
                    }}>{uc.icon}</div>
                    <div>
                      <h4 style={{ marginBottom: '8px', fontSize: '1rem' }}>{uc.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{uc.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── SECURITY ────────────────────────────────────────── */}
        <motion.section
          className="container"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={FADE_UP}
          style={{ paddingBottom: '120px' }}
        >
          <div style={{
            background: 'rgba(245,158,11,0.04)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderRadius: '28px',
            padding: '64px 56px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Corner glow */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(245,158,11,0.20) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)', filter: 'blur(40px)' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '56px', alignItems: 'start', position: 'relative' }}>
              <div>
                <div className="badge badge-gold" style={{ marginBottom: '20px', fontFamily: 'var(--font-heading)', fontSize: '0.65rem' }}>SECURITY</div>
                <h2 style={{ marginBottom: '16px' }}>Your funds are safer here than in a bank.</h2>
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '36px', fontSize: '0.9375rem' }}>
                  Not because we say so. Because the code is public and the math doesn&apos;t lie.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {[
                    { title: 'Non-custodial escrow', desc: 'Funds live in a Solana smart contract. PayLink cannot access, freeze, or move them. Only you and your recipient hold the keys.' },
                    { title: 'Automatic reclamation', desc: 'You set the expiry window. If unclaimed, your funds return to you on-chain automatically — no support ticket required.' },
                    { title: 'Phone-verified claiming', desc: 'Recipients verify with a one-time code. No wallet. No password. No account needed.' },
                  ].map(item => (
                    <div key={item.title} style={{ display: 'flex', gap: '14px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                        <ShieldCheck size={12} style={{ color: '#10B981' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px', fontSize: '0.9375rem' }}>{item.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code card */}
              <div style={{
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '20px',
                padding: '28px',
                overflow: 'hidden',
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', fontSize: '1rem' }}>Open Source Contract</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Written in Rust. Built with Anchor. Every constraint auditable on-chain.</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '16px', letterSpacing: '0.02em' }}>
                  Program: 3aNvxijKXfz2VBDEH5iKXnvebjUretGgtgFwzqFjP5EV
                </div>
                <div style={{
                  background: '#0A0A0A',
                  borderRadius: '12px',
                  padding: '20px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  lineHeight: 1.7,
                  color: '#94A3B8',
                  overflowX: 'auto',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <pre style={{ margin: 0 }}><code>
{`#[account(
  mut,
  `}<span style={{ color: '#F59E0B' }}>close</span>{` = sender,
  `}<span style={{ color: '#F59E0B' }}>seeds</span>{` = [
    b"escrow",
    claim_seed.as_ref()
  ],
  `}<span style={{ color: '#F59E0B' }}>bump</span>{` = escrow.bump
)]
`}<span style={{ color: '#A78BFA' }}>pub</span>{` escrow: Box<
  Account<EscrowAccount>
>,`}
                  </code></pre>
                </div>
                {/* Tech chips */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>
                  {['Anchor 0.29', 'Rust', 'Solana Devnet', 'SPL Token'].map(t => (
                    <span key={t} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── TECH FEATURES ───────────────────────────────────── */}
        <motion.section
          className="container"
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={STAGGER}
          style={{ paddingBottom: '120px' }}
        >
          <motion.div variants={FADE_UP} className="text-center" style={{ marginBottom: '64px' }}>
            <h2 style={{ marginBottom: '12px' }}>Built on Solana for a reason.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>400ms finality. $0.001 fees. No other chain makes this viable.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { icon: <Zap size={20} />, label: 'Anchor Escrow', detail: 'Multi-token (USDC + USDT). PDA-derived accounts. Strict ownership. Rent reclaimed on close.', color: 'var(--gold)' },
              { icon: <RefreshCcw size={20} />, label: 'Auto-Reclaim', detail: 'Set exact expiration. Funds return to sender on-chain automatically if unclaimed.', color: 'var(--purple-light)' },
              { icon: <Coins size={20} />, label: 'Multi-Token', detail: 'Native USDC and USDT on Solana. Devnet today, mainnet ready.', color: '#10B981' },
              { icon: <ShieldCheck size={20} />, label: 'What we don\'t do', detail: '✕ Hold your funds\n✕ Collect KYC\n✕ Charge fees\n✕ Require a wallet', color: '#60A5FA' },
            ].map(f => (
              <motion.div key={f.label} variants={FADE_UP}>
                <TiltCard>
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'flex', flexDirection: 'column', gap: '14px',
                    height: '100%',
                  }}>
                    <div style={{ color: f.color }}>{f.icon}</div>
                    <div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '8px' }}>{f.label}</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', whiteSpace: 'pre-line', lineHeight: 1.65 }}>{f.detail}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── FINAL CTA ───────────────────────────────────────── */}
        <motion.section
          initial="hidden" whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={FADE_UP}
          style={{
            margin: '0 0 0 0',
            padding: '120px 0',
            background: 'linear-gradient(180deg, transparent 0%, rgba(245,158,11,0.04) 40%, rgba(139,92,246,0.05) 100%)',
            borderTop: '1px solid rgba(245,158,11,0.08)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse, rgba(245,158,11,0.08) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div className="container" style={{ position: 'relative' }}>
            <h2 style={{ marginBottom: '16px', maxWidth: '620px', margin: '0 auto 16px' }}>
              Stop explaining crypto to people you&apos;re trying to pay.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginBottom: '40px' }}>
              PayLink handles the complexity. They just tap a link.
            </p>
            <div className="flex justify-center gap-md flex-col-mobile" style={{ marginBottom: '24px' }}>
              <Link href="/create" className="btn btn-primary btn-xl pulse-gold">
                Create your first PayLink <ArrowRight size={18} />
              </Link>
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              No sign-up · Connect wallet · Generate link · Send money
            </p>
          </div>
        </motion.section>

      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .hero-card-wrap { display: none; }
        }
      `}</style>
    </>
  );
}
