import { Link } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="container" style={{ paddingTop: '60px', paddingBottom: '60px' }}>
      {/* Hero */}
      <section className="text-center" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(0, 212, 170, 0.08)',
          border: '1px solid rgba(0, 212, 170, 0.15)',
          fontSize: '0.8125rem',
          color: 'var(--accent)',
          fontWeight: 500,
          marginBottom: '24px',
        }}>
          ⚡ Powered by Solana
        </div>

        <h1 style={{ marginBottom: '20px', lineHeight: 1.1 }}>
          Send money with{' '}
          <span className="text-gradient">a link</span>
        </h1>

        <p style={{
          fontSize: '1.125rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.7,
          marginBottom: '40px',
        }}>
          Create a shareable payment link for USDC or USDT on Solana.
          No wallet address needed — just share the URL.
        </p>

        <div className="flex items-center justify-center gap-md">
          {connected ? (
            <Link to="/create" className="btn btn-primary btn-lg">
              Create Payment Link
            </Link>
          ) : (
            <WalletMultiButton />
          )}
          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            My Links
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ marginTop: '100px' }}>
        <h2 className="text-center" style={{ marginBottom: '48px' }}>
          How it works
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              step: '01',
              title: 'Create',
              desc: 'Pick USDC or USDT, enter the amount, and generate a payment link. Funds are locked in an on-chain escrow.',
              icon: '🔗',
            },
            {
              step: '02',
              title: 'Share',
              desc: 'Copy the link or scan the QR code. Send it via text, email, or any messaging app.',
              icon: '📤',
            },
            {
              step: '03',
              title: 'Claim',
              desc: 'The recipient opens the link, connects their wallet, and instantly receives the funds.',
              icon: '✅',
            },
          ].map((item) => (
            <div key={item.step} className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 212, 170, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 16px',
              }}>
                {item.icon}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--accent)',
                fontWeight: 700,
                letterSpacing: '0.1em',
                marginBottom: '8px',
              }}>
                STEP {item.step}
              </div>
              <h3 style={{ marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ marginTop: '80px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          {[
            { label: 'Instant Settlement', detail: 'Solana finality in < 1 second' },
            { label: 'Auto-Reclaim', detail: 'Unclaimed funds return after 7 days' },
            { label: 'Zero Fees', detail: 'Only Solana network fees (~$0.001)' },
            { label: 'Multi-Token', detail: 'USDC and USDT supported' },
          ].map((f) => (
            <div key={f.label} className="glass-card" style={{ padding: '20px' }}>
              <h4 style={{ fontSize: '0.9375rem', marginBottom: '4px' }}>{f.label}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{f.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
