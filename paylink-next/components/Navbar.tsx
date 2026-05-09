'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import { LayoutDashboard, Plus, Home } from 'lucide-react';

const NAV_LINKS = [
  { href: '/',          label: 'Home',      icon: <Home size={14} /> },
  { href: '/create',    label: 'Create',    icon: <Plus size={14} /> },
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={14} /> },
];

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
    <path d="M50 0L93.3 25V75L50 100L6.7 75V25L50 0Z" fill="url(#lg1)"/>
    <path d="M50 22L75.98 37V67L50 82L24.02 67V37L50 22Z" fill="rgba(10,14,26,0.6)"/>
    <path d="M50 38L63.86 46V62L50 70L36.14 62V46L50 38Z" fill="url(#lg2)"/>
    <defs>
      <linearGradient id="lg1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B"/>
        <stop offset="1" stopColor="#D97706"/>
      </linearGradient>
      <linearGradient id="lg2" x1="36" y1="38" x2="64" y2="70" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FBBF24"/>
        <stop offset="1" stopColor="#F59E0B"/>
      </linearGradient>
    </defs>
  </svg>
);

export function Navbar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  if (pathname === '/c') return null;

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <Logo />
        Pay<span style={{ color: 'var(--gold)' }}>Link</span>
      </Link>

      <div className="navbar-links">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="btn btn-ghost btn-sm"
              style={{
                color: active ? 'var(--gold)' : 'var(--text-secondary)',
                borderColor: active ? 'var(--gold-border)' : 'transparent',
                background: active ? 'var(--gold-glow-soft)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}
            >
              {link.icon}
              {link.label}
              {active && (
                <motion.span
                  layoutId="nav-active"
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '20%', right: '20%',
                    height: '2px',
                    background: 'var(--gold)',
                    borderRadius: '2px',
                  }}
                />
              )}
            </Link>
          );
        })}

        {!connected && (
          <Link
            href="/create"
            className="btn btn-outline btn-sm"
            style={{ marginRight: '4px' }}
          >
            Get Started
          </Link>
        )}
        <WalletMultiButton />
      </div>
    </nav>
  );
}
