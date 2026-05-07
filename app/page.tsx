'use client';

import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion, useScroll, useTransform } from 'framer-motion';
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
    transition: { duration: 0.6, ease: "easeOut" }
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
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 50%, rgba(10,15,30,0.95) 85%, rgba(10,15,30,1) 100%)',
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
          {/* Logo */}
          <motion.div variants={FADE_IN} style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(16px)',
              borderRadius: '32px',
              boxShadow: '0 16px 40px rgba(37, 99, 235, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'translateZ(0)'
            }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 0L93.3013 25V75L50 100L6.69873 75V25L50 0Z" fill="#00C853"/>
                <path d="M50 25L71.6506 37.5V62.5L50 75L28.3494 62.5V37.5L50 25Z" fill="white"/>
                <path d="M50 40L63 47.5V62.5L50 70V40Z" fill="#00C853"/>
              </svg>
            </div>
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

          <motion.h1 variants={FADE_IN} style={{ marginBottom: '16px', lineHeight: 1.08, fontSize: '3.75rem', color: 'white', textShadow: '0 2px 20px rgba(0,0,0,0.4)', letterSpacing: '-0.02em' }}>
            Send money to anyone.{' '}
            <span style={{ background: 'linear-gradient(90deg, #00C853, #69F0AE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>No wallet required.</span>
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
      <div style={{ background: 'linear-gradient(to bottom, rgb(10,15,30), #0f172a)', position: 'relative' }}>

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
              <h3 style={{ fontSize: '2.5rem', color: '#00C853', marginBottom: '8px', fontWeight: 800 }}>{'< 400ms'}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>SETTLEMENT</p>
            </motion.div>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: '#00C853', marginBottom: '8px', fontWeight: 800 }}>$0.001</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>NETWORK FEE</p>
            </motion.div>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: '#00C853', marginBottom: '8px', fontWeight: 800 }}>72hr</h3>
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
          <motion.h2 variants={FADE_IN} className="text-center" style={{ marginBottom: '16px', color: 'white' }}>
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
                icon: <LinkIcon size={28} color="#00C853" />,
              },
              {
                step: '02',
                label: 'Send',
                title: 'Share a link',
                desc: 'A unique URL is generated instantly. Send it over WhatsApp, SMS, email, or a DM. No wallet address required. No QR codes. No explaining what a blockchain is.',
                icon: <Send size={28} color="#00C853" />,
              },
              {
                step: '03',
                label: 'Claim',
                title: 'Recipient taps, money arrives',
                desc: 'They open the link in any browser. Verify with a phone number. That\'s it. Funds released. No app download. No account creation. No crypto knowledge required.',
                icon: <Wallet size={28} color="#00C853" />,
              },
            ].map((item) => (
              <motion.div 
                variants={FADE_IN} 
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                key={item.step} 
                style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', transition: 'all 0.3s ease' }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(0, 200, 83, 0.1)',
                  border: '1px solid rgba(0, 200, 83, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '24px',
                }}>
                  {item.icon}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#00C853',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  marginBottom: '6px',
                }}>
                  {item.step} / {item.label}
                </div>
                <h3 style={{ marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.0625rem', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
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
            <h2 style={{ marginBottom: '16px', color: 'white' }}>Not built for crypto natives.<br/>Built for everyone else.</h2>
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
              <motion.div variants={FADE_IN} key={i} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '24px' }}>
                <div style={{ color: '#00C853', background: 'rgba(0, 200, 83, 0.1)', padding: '12px', borderRadius: '12px', flexShrink: 0 }}>
                  {uc.icon}
                </div>
                <div>
                  <h4 style={{ marginBottom: '8px', color: 'white' }}>{uc.title}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9375rem' }}>{uc.desc}</p>
                </div>
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
          style={{ marginTop: '160px', padding: '64px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '32px', color: 'white' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '16px' }}>Your funds are safer here than in a bank.</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', marginBottom: '8px', fontStyle: 'italic' }}>
                Not because we say so.
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', marginBottom: '32px', fontStyle: 'italic' }}>
                Because the code is public and the math doesn&apos;t lie.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldCheck color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '4px' }}>Non-custodial escrow</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Funds live in a Solana smart contract. PayLink cannot access, freeze, or move them. Only you and your recipient hold the keys.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldCheck color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '4px' }}>Automatic reclamation</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>You set the expiry window. If the link goes unclaimed, your funds return to you automatically — no support ticket required.</div>
                  </div>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <ShieldCheck color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '4px' }}>Phone-verified claiming</div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>Recipients verify ownership with a one-time code sent to their phone number. No wallet. No password. No account.</div>
                  </div>
                </li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#00C853', filter: 'blur(80px)', opacity: 0.3 }}></div>
              <h3 style={{ color: 'white', marginBottom: '8px' }}>Open source contract</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9375rem', marginBottom: '8px' }}>Written in Rust. Built with Anchor. Every constraint is auditable on-chain.</p>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', marginBottom: '20px', fontFamily: 'monospace' }}>Program ID: 3aNvxijKXfz2VBDEH5iKXnvebjUretGgtgFwzqFjP5EV</p>
              <div style={{ background: '#000', padding: '16px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#10b981', overflowX: 'auto' }}>
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
            <h2 style={{ color: 'white', marginBottom: '16px' }}>Built on Solana for a reason.</h2>
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
              <motion.div variants={FADE_IN} key={i} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
                <div style={{ color: '#00C853' }}>{f.icon}</div>
                <div>
                  <h4 style={{ fontSize: '1.0625rem', marginBottom: '8px', color: 'white' }}>{f.label}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{f.detail}</p>
                </div>
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
          <h2 style={{ marginBottom: '16px', color: 'white' }}>Stop explaining crypto to people you&apos;re trying to pay.</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '1.125rem' }}>
            PayLink handles the complexity.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px', fontSize: '1.125rem' }}>
            They just tap a link.
          </p>
          <Link href="/create" className="btn btn-primary btn-lg" style={{ background: '#00C853', borderColor: '#00C853' }}>
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
