'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/create', label: 'Create' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const pathname = usePathname();
  const { connected } = useWallet();

  // Don't show navbar on claim pages (clean recipient experience)
  if (pathname === '/c') return null;

  return (
    <nav className="navbar" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Link href="/" className="navbar-brand" style={{ color: 'white' }}>
        <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0L93.3013 25V75L50 100L6.69873 75V25L50 0Z" fill="#00C853"/>
            <path d="M50 25L71.6506 37.5V62.5L50 75L28.3494 62.5V37.5L50 25Z" fill="white"/>
            <path d="M50 40L63 47.5V62.5L50 70V40Z" fill="#00C853"/>
          </svg>
        </div>
        Pay<span style={{ color: '#00C853' }}>Link</span>
      </Link>

      <div className="navbar-links">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="btn btn-ghost btn-sm"
            style={{
              color:
                pathname === link.href
                  ? '#00C853'
                  : 'rgba(255,255,255,0.7)',
              fontWeight: pathname === link.href ? 600 : 500,
            }}
          >
            {link.label}
          </Link>
        ))}
        <Link 
          href="/create" 
          className="btn btn-sm"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Sign In
        </Link>
        <WalletMultiButton />
      </div>
    </nav>
  );
}
