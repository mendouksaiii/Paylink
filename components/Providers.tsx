'use client';

import { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { Toaster } from 'sonner';
import { MoonPayProvider } from '@moonpay/moonpay-react';

import '@solana/wallet-adapter-react-ui/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <MoonPayProvider
            apiKey={process.env.NEXT_PUBLIC_MOONPAY_API_KEY || 'pk_test_123'}
            environment="sandbox"
            debug={true}
          >
            {children}
          </MoonPayProvider>
          <Toaster
            position="top-right"
            theme="light"
            toastOptions={{
              style: {
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
              },
            }}
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
