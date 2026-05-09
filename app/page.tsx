'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { 
  Link as LinkIcon, 
  Send, 
  Wallet, 
  ShieldCheck, 
  Zap, 
  Coins, 
  RefreshCcw,
  Briefcase,
  Building2,
  Users
} from 'lucide-react';

const FADE_IN = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const STAGGER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

function TiltCard({ children, style, className }: { children: React.ReactNode, style?: React.CSSProperties, className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  const [isHovered, setIsHovered] = useState(false);

  // Disable intense 3D on mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      x.set(event.clientX - rect.left - rect.width / 2);
      y.set(event.clientY - rect.top - rect.height / 2);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      className={className}
      style={{
        ...style,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={isMobile ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d', width: '100%', height: '100%' }}>
        <div style={{ transform: isHovered && !isMobile ? 'translateZ(30px)' : 'translateZ(0)', height: '100%', transition: 'transform 0.2s ease-out' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const { connected } = useWallet();
  const { scrollY } = useScroll();
  
  const heroBgY = useTransform(scrollY, [0, 600], [0, -250]);
  const heroBgOpacity = useTransform(scrollY, [0, 500], [1, 0]);

  return (
    <>
      {/* Hero Section with Background Image */}
      <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Background Image Layer */}
        <motion.div 
          style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            y: heroBgY,
          }}
        >
          <img 
            src="/landing-bg.jpg" 
            alt="" 
            style={{
              width: '100%',
              height: '120%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              display: 'block',
            }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.3) 50%, rgba(15,23,42,0.95) 85%, rgba(15,23,42,1) 100%)',
          }} />
        </motion.div>

        {/* Hero Content */}
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
        
        <motion.section 
          initial="hidden" 
          animate="visible" 
          variants={STAGGER}
          className="text-center" 
          style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}
        >
          {/* Floating Coin Logo */}
          <motion.div variants={FADE_IN} style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <motion.div 
              animate={{ 
                y: [0, -20, 0],
                rotateY: [0, 180, 360],
                rotateX: [10, -10, 10]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: '120px', height: '120px', background: 'linear-gradient(135deg, var(--accent), #D97706)',
                borderRadius: '50%',
                boxShadow: '0 0 30px var(--accent-glow-strong), inset 0 0 20px rgba(255,255,255,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-orbitron)', fontWeight: 900, fontSize: '2rem', color: 'var(--bg-primary)',
                transformStyle: 'preserve-3d'
              }}
            >
              USDC
            </motion.div>
          </motion.div>

          <motion.div variants={FADE_IN} style={{
            display: 'inline-flex',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            fontSize: '0.8125rem',
            color: 'white',
            fontWeight: 600,
            marginBottom: '24px',
            backdropFilter: 'blur(8px)',
          }}>
            ⚡ Powered by Solana
          </motion.div>

          <motion.h1 variants={FADE_IN} style={{ marginBottom: '16px', lineHeight: 1.08, fontSize: '3.75rem', color: 'white', textShadow: '0 2px 20px rgba(0,0,0,0.4)', letterSpacing: '-0.02em', fontFamily: 'var(--font-orbitron)' }}>
            Send money to anyone.{' '}
            <span style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>No wallet required.</span>
          </motion.h1>

          <motion.p variants={FADE_IN} style={{
            fontSize: '1.125rem',
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: 1.6,
            maxWidth: '520px',
            margin: '0 auto 16px auto',
            textShadow: '0 1px 8px rgba(0,0,0,0.2)'
          }}>
            USDC. Solana speed. Claimed with a phone number.
          </motion.p>

          <motion.p variants={FADE_IN} style={{
            fontSize: '1.375rem',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: 600,
            marginBottom: '48px',
            textShadow: '0 1px 8px rgba(0,0,0,0.2)'
          }}>
            One link. That&apos;s all they need.
          </motion.p>

          <motion.div variants={FADE_IN} className="flex items-center justify-center gap-md flex-col-mobile">
            {connected ? (
              <Link href="/create" className="btn btn-primary btn-lg">
                Create a PayLink
              </Link>
            ) : (
              <WalletMultiButton />
            )}
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              View Dashboard
            </Link>
          </motion.div>
        </motion.section>
        </div>
      </div>

      {/* Below-fold content */}
      <div style={{ background: 'linear-gradient(to bottom, var(--bg-primary), var(--bg-secondary))', position: 'relative' }}>

        <div className="liquid-bg" style={{ opacity: 0.15 }}>
          <div className="liquid-stream"></div>
          <div className="liquid-stream-2"></div>
          <div className="liquid-stream-3"></div>
        </div>

        <div className="container" style={{ paddingBottom: '100px', position: 'relative', zIndex: 1 }}>

        {/* Stats bar */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          style={{ padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '32px' }}>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '8px', fontWeight: 800, fontFamily: 'var(--font-orbitron)' }}>{'< 400ms'}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>SETTLEMENT</p>
            </motion.div>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '8px', fontWeight: 800, fontFamily: 'var(--font-orbitron)' }}>$0.001</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>NETWORK FEE</p>
            </motion.div>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '8px', fontWeight: 800, fontFamily: 'var(--font-orbitron)' }}>72hr</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>CLAIM WINDOW</p>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          style={{ marginTop: '120px' }}
        >
          <motion.h2 variants={FADE_IN} className="text-center" style={{ marginBottom: '16px', color: 'white', fontFamily: 'var(--font-orbitron)' }}>
            Three steps. Millions of people.
          </motion.h2>
          <motion.p variants={FADE_IN} className="text-center" style={{ marginBottom: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>
            Built for the person who doesn&apos;t know what a seed phrase is.
          </motion.p>
          <motion.p variants={FADE_IN} className="text-center" style={{ marginBottom: '64px', color: 'rgba(255,255,255,0.35)', fontSize: '1rem' }}>
            And never should have to.
          </motion.p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
          }}>
            {[
              {
                step: '01',
                label: 'Lock',
                title: 'Create a PayLink',
                desc: 'Connect your wallet. Select USDC or USDT. Enter the amount and set an expiry window. Your funds are locked in an audited Solana smart contract — not on our servers, not in our custody. Ever.',
                icon: <LinkIcon size={28} color="var(--accent)" />,
              },
              {
                step: '02',
                label: 'Send',
                title: 'Share a link',
                desc: 'A unique URL is generated instantly. Send it over WhatsApp, SMS, email, or a DM. No wallet address required. No QR codes. No explaining what a blockchain is.',
                icon: <Send size={28} color="var(--accent)" />,
              },
              {
                step: '03',
                label: 'Claim',
                title: 'Recipient taps, money arrives',
                desc: 'They open the link in any browser. Verify with a phone number. That\'s it. Funds released. No app download. No account creation. No crypto knowledge required.',
                icon: <Wallet size={28} color="var(--accent)" />,
              },
            ].map((item) => (
              <motion.div variants={FADE_IN} key={item.step} style={{ width: '100%' }}>
                <TiltCard style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'var(--accent-glow)',
                    border: '1px solid var(--accent-glow-strong)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                  }}>
                    {item.icon}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    marginBottom: '6px',
                  }}>
                    {item.step} / {item.label}
                  </div>
                  <h3 style={{ marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700, color: 'white', fontFamily: 'var(--font-orbitron)' }}>{item.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.0625rem', lineHeight: 1.6 }}>
                    {item.desc}
                  </p>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Who it's for */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          style={{ marginTop: '160px' }}
        >
          <motion.div variants={FADE_IN} style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 64px auto' }}>
            <h2 style={{ marginBottom: '16px', color: 'white', fontFamily: 'var(--font-orbitron)' }}>Not built for crypto natives.<br/>Built for everyone else.</h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
              {
                title: 'Freelancers & Remote Workers',
                desc: 'Invoice international clients without sharing a wallet address. Get paid in USDC. Convert to local currency on your terms. No wire fees. No 3–5 business days.',
                icon: <Briefcase size={24} />
              },
              {
                title: 'Families sending money home',
                desc: 'Remittances cost an average of 6.2% globally. PayLink costs less than a cent. Your family receives a WhatsApp link. They claim it to their bank. Done.',
                icon: <Users size={24} />
              },
              {
                title: 'Merchants & Market Traders',
                desc: 'Accept digital payments without a POS terminal, a bank account, or a crypto wallet. One link. Any amount. Any customer.',
                icon: <Building2 size={24} />
              }
            ].map((uc, i) => (
              <motion.div variants={FADE_IN} key={i} style={{ width: '100%' }}>
                <TiltCard style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', padding: '24px' }}>
                  <div style={{ color: 'var(--accent)', background: 'var(--accent-glow)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
                    {uc.icon}
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '8px', color: 'white', fontFamily: 'var(--font-orbitron)' }}>{uc.title}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9375rem' }}>{uc.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Security */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={FADE_IN}
          style={{ marginTop: '160px', padding: '64px 48px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '32px', color: 'white' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '16px', fontFamily: 'var(--font-orbitron)' }}>Your funds are safer here than in a bank.</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', marginBottom: '8px', fontStyle: 'italic' }}>
                Not because we say so.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', marginBottom: '32px', fontStyle: 'italic' }}>
                Because the code is public and the math doesn&apos;t lie.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldCheck color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '4px' }}>Non-custodial escrow</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Funds live in a Solana smart contract. PayLink cannot access, freeze, or move them. Only you and your recipient hold the keys.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldCheck color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '4px' }}>Automatic reclamation</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>You set the expiry window. If the link goes unclaimed, your funds return to you automatically — no support ticket required.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldCheck color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '4px' }}>Phone-verified claiming</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Recipients verify ownership with a one-time code sent to their phone number. No wallet. No password. No account.</div>
                  </div>
                </li>
              </ul>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.2 }}></div>
              <h3 style={{ color: 'white', marginBottom: '8px', fontFamily: 'var(--font-orbitron)' }}>Open source contract</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9375rem', marginBottom: '8px' }}>Written in Rust. Built with Anchor. Every constraint is auditable on-chain.</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginBottom: '20px', fontFamily: 'monospace' }}>Program ID: 3aNvxijKXfz2VBDEH5iKXnvebjUretGgtgFwzqFjP5EV</p>
              <div style={{ background: '#000', padding: '16px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--success)', overflowX: 'auto' }}>
                <pre><code>
{`#[account(
  mut,
  close = sender,
  seeds = [b"escrow", claim_seed.as_ref()],
  bump = escrow_account.bump
)]
pub escrow_account: Box<Account<'info, EscrowAccount>>,`}
                </code></pre>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Technical — for builders */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          style={{ marginTop: '160px' }}
        >
          <motion.div variants={FADE_IN} style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 16px auto' }}>
            <h2 style={{ color: 'white', marginBottom: '16px', fontFamily: 'var(--font-orbitron)' }}>Built on Solana for a reason.</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.0625rem', marginBottom: '8px' }}>400ms finality. $0.001 fees. Global reach.</p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.9375rem', marginBottom: '48px' }}>No other chain makes this product viable at this price point.</p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}>
            {[
              { label: 'Anchor escrow program', detail: 'Multi-token support (USDC + USDT). PDA-derived escrow accounts. Strict ownership constraints. Rent reclamation on close.', icon: <Zap size={20} /> },
              { label: 'Auto-Reclaim', detail: 'Unclaimed funds are never lost. You set the exact expiration window. Funds return to sender on-chain automatically.', icon: <RefreshCcw size={20} /> },
              { label: 'Multi-Token', detail: 'Natively supports USDC and USDT stablecoins on Solana devnet and mainnet.', icon: <Coins size={20} /> },
              { label: 'What we don\'t do', detail: '✕  Hold your funds\n✕  Collect KYC\n✕  Charge platform fees\n✕  Require the recipient to have a wallet', icon: <ShieldCheck size={20} /> },
            ].map((f, i) => (
              <motion.div variants={FADE_IN} key={i} style={{ width: '100%' }}>
                <TiltCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px' }}>
                  <div style={{ color: 'var(--accent)' }}>{f.icon}</div>
                  <div>
                    <h4 style={{ fontSize: '1.0625rem', marginBottom: '8px', color: 'white', fontFamily: 'var(--font-orbitron)' }}>{f.label}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{f.detail}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Footer CTA */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={FADE_IN}
          className="text-center"
          style={{ marginTop: '160px', padding: '80px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 style={{ marginBottom: '16px', color: 'white', fontFamily: 'var(--font-orbitron)' }}>Stop explaining crypto to people you&apos;re trying to pay.</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '1.125rem' }}>
            PayLink handles the complexity.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px', fontSize: '1.125rem' }}>
            They just tap a link.
          </p>
          <Link href="/create" className="btn btn-primary btn-lg" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--bg-primary)' }}>
            Create your first PayLink →
          </Link>
          <p style={{ color: 'rgba(255,255,255,0.25)', marginTop: '20px', fontSize: '0.875rem' }}>
            No sign-up required. Connect wallet. Generate link. Send money.
          </p>
        </motion.section>

      </div>
      </div>
    </>
  );
}
