import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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
    <html lang="en" className={inter.variable}>
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
