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
  
  // Parallax calculations for the hero background
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
          {/* Dark cinematic overlay - NO whiteness */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 50%, rgba(10,15,30,0.95) 85%, rgba(10,15,30,1) 100%)',
          }} />
        </motion.div>

        {/* Hero Content (sits on top of the image) */}
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px', position: 'relative', zIndex: 10 }}>
        
        {/* Hero Section */}
        <motion.section 
          initial="hidden" 
          animate="visible" 
          variants={STAGGER}
          className="text-center" 
          style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}
        >
          {/* Creative Logo Integration */}
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
              transform: 'translateZ(0)' // Hardware acceleration
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

          <motion.h1 variants={FADE_IN} style={{ marginBottom: '28px', lineHeight: 1.08, fontSize: '3.75rem', color: 'white', textShadow: '0 2px 20px rgba(0,0,0,0.4)', letterSpacing: '-0.02em' }}>
            Your grandma doesn&apos;t need a wallet.{' '}
            <span style={{ background: 'linear-gradient(90deg, #00C853, #69F0AE)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>She just needs a link.</span>
          </motion.h1>

          <motion.p variants={FADE_IN} style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: 1.7,
            maxWidth: '600px',
            margin: '0 auto 48px auto',
            textShadow: '0 1px 8px rgba(0,0,0,0.2)'
          }}>
            Send crypto to anyone on earth. They claim it with a tap. No app downloads. No seed phrases. No confusion. Just money, moving.
          </motion.p>

          <motion.div variants={FADE_IN} className="flex items-center justify-center gap-md flex-col-mobile">
            {connected ? (
              <Link href="/create" className="btn btn-primary btn-lg">
                Create Payment Link
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

      {/* Below-fold content — dark seamless background */}
      <div style={{ background: 'linear-gradient(to bottom, rgb(10,15,30), #0f172a)', position: 'relative' }}>

        {/* Liquid Stream Background - tinted dark */}
        <div className="liquid-bg" style={{ opacity: 0.15 }}>
          <div className="liquid-stream"></div>
          <div className="liquid-stream-2"></div>
          <div className="liquid-stream-3"></div>
        </div>

        <div className="container" style={{ paddingBottom: '100px', position: 'relative', zIndex: 1 }}>

        {/* Stats / Social Proof */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          style={{ padding: '64px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '32px' }}>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: '#00C853', marginBottom: '8px', fontWeight: 800 }}>&lt; 1s</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>SETTLEMENT TIME</p>
            </motion.div>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: '#00C853', marginBottom: '8px', fontWeight: 800 }}>$0.001</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>AVERAGE FEE</p>
            </motion.div>
            <motion.div variants={FADE_IN} className="text-center">
              <h3 style={{ fontSize: '2.5rem', color: '#00C853', marginBottom: '8px', fontWeight: 800 }}>100%</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 600, letterSpacing: '0.05em' }}>YOUR MONEY, YOUR RULES</p>
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
            Three steps. That&apos;s it.
          </motion.h2>
          <motion.p variants={FADE_IN} className="text-center" style={{ marginBottom: '64px', color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>
            No KYC. No bank account. No hassle.
          </motion.p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
          }}>
            {[
              {
                step: '01',
                title: 'Create a PayLink',
                desc: 'Select your stablecoin and enter the amount. Our smart contract locks the funds safely.',
                icon: <LinkIcon size={28} color="#00C853" />,
              },
              {
                step: '02',
                title: 'Send via WhatsApp or SMS',
                desc: 'Share the unique URL with anyone. No need to ask for their complicated wallet address.',
                icon: <Send size={28} color="#00C853" />,
              },
              {
                step: '03',
                title: 'Claim with just a Phone',
                desc: 'The recipient clicks the link and claims the funds instantly. Web3 made accessible for all.',
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
                  fontSize: '0.875rem',
                  color: '#00C853',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  marginBottom: '12px',
                }}>
                  STEP {item.step}
                </div>
                <h3 style={{ marginBottom: '12px', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.0625rem', lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Use Cases */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          style={{ marginTop: '160px' }}
        >
          <motion.div variants={FADE_IN} style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 64px auto' }}>
            <h2 style={{ marginBottom: '24px', color: 'white' }}>Built for people, not protocols.</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.125rem' }}>
              We didn&apos;t build PayLink for crypto natives. We built it for the 8 billion people who just want to send and receive money without headaches.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {[
              {
                title: 'Tech Bros & Freelancers',
                desc: 'Get paid instantly by global clients without the friction of sharing long alphanumeric wallet addresses. Just send an invoice with a PayLink.',
                icon: <Briefcase size={24} />
              },
              {
                title: 'Market Women & Traders',
                desc: 'Accept payments seamlessly. No need for complex crypto knowledge—just tap the link and claim your funds securely.',
                icon: <Building2 size={24} />
              },
              {
                title: 'Farmers & Everyday Workers',
                desc: 'Receive remittances from family abroad or payments for goods instantly, bypassing slow and expensive traditional banking channels.',
                icon: <Users size={24} />
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

        {/* Trust & Security */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={FADE_IN}
          style={{ marginTop: '160px', padding: '64px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '32px', color: 'white' }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <h2 style={{ color: 'white', marginBottom: '24px' }}>Your money is safer than a bank vault.</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.125rem', marginBottom: '32px' }}>
                Funds sit in an audited Solana smart contract—not on our servers. Nobody can touch your money except you and your recipient. If unclaimed, funds return to you automatically.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <ShieldCheck color="#10b981" />
                  <span>On-chain Escrow via Anchor</span>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <ShieldCheck color="#10b981" />
                  <span>Zero-Knowledge 2FA Verification</span>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <ShieldCheck color="#10b981" />
                  <span>Automated Expiry & Reclaims</span>
                </li>
              </ul>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: '#00C853', filter: 'blur(80px)', opacity: 0.3 }}></div>
              <h3 style={{ color: 'white', marginBottom: '16px' }}>Smart Contract Validated</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9375rem', marginBottom: '24px' }}>Our program is written in Rust using the Anchor framework, following strict multi-token constraints.</p>
              <div style={{ background: '#000', padding: '16px', borderRadius: '12px', fontFamily: 'monospace', fontSize: '0.8125rem', color: '#10b981', overflowX: 'auto' }}>
                <pre><code>
{`#[account(
    init_if_needed,
    payer = sender,
    associated_token::mint = mint,
    associated_token::authority = claim_account
)]
pub claim_ata: Account<'info, TokenAccount>,`}
                </code></pre>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Features Grid */}
        <motion.section 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={STAGGER}
          style={{ marginTop: '160px' }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}>
            {[
              { label: 'Lightning Fast', detail: 'Solana finality in < 400ms. Payments are processed instantly globally.', icon: <Zap size={20} /> },
              { label: 'Auto-Reclaim', detail: 'Unclaimed funds are never lost. You set the exact expiration date.', icon: <RefreshCcw size={20} /> },
              { label: 'Multi-Token', detail: 'Natively supports USDC and USDT stablecoins on Solana.', icon: <Coins size={20} /> },
              { label: 'Zero Platform Fees', detail: 'You only pay the Solana network fee, which is a fraction of a cent.', icon: <ShieldCheck size={20} /> },
            ].map((f, i) => (
              <motion.div variants={FADE_IN} key={i} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
                <div style={{ color: '#00C853' }}>{f.icon}</div>
                <div>
                  <h4 style={{ fontSize: '1.0625rem', marginBottom: '8px', color: 'white' }}>{f.label}</h4>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>{f.detail}</p>
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
          <h2 style={{ marginBottom: '24px', color: 'white' }}>Stop explaining crypto.<br/>Start sending money.</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '40px', fontSize: '1.125rem' }}>
            No sign-ups. No hidden fees. Just connect your wallet and create your first link.
          </p>
          <Link href="/create" className="btn btn-primary btn-lg" style={{ background: '#00C853', borderColor: '#00C853' }}>
            Create Your First PayLink
          </Link>
        </motion.section>

      </div>
      </div>
    </>
  );
}
