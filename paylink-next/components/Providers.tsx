'use client';

import { useMemo } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { Toaster } from 'sonner';

import '@solana/wallet-adapter-react-ui/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  const endpoint =
    process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  const content = (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                color: '#f1f5f9',
                backdropFilter: 'blur(12px)',
              },
            }}
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );

  if (!privyAppId) {
    return <>{content}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['sms'],
        appearance: { theme: 'light', accentColor: '#2563eb' },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      {content}
    </PrivyProvider>
  );
}
