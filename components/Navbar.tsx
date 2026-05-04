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
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <span className="logo-icon">⚡</span>
        Pay<span style={{ color: 'var(--accent)' }}>Link</span>
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
                  ? 'var(--accent)'
                  : 'var(--text-secondary)',
            }}
          >
            {link.label}
          </Link>
        ))}
        <WalletMultiButton />
      </div>
    </nav>
  );
}
