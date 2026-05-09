import type { Metadata } from 'next';
import { Exo_2, Orbitron } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

const exo2 = Exo_2({
  subsets: ['latin'],
  variable: '--font-exo2',
  display: 'swap',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PayLink — Send money with a link',
  description:
    'Create shareable payment links for USDC or USDT on Solana. No wallet address needed — just share the URL.',
  keywords: ['solana', 'payment', 'usdc', 'usdt', 'crypto', 'escrow', 'payment link'],
  openGraph: {
    title: 'PayLink — Send money with a link',
    description: 'Escrow USDC/USDT on Solana and share a claim URL.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${exo2.variable} ${orbitron.variable}`}>
      <body>
        <Providers>
          <div id="root">
            <Navbar />
            <main className="page">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
