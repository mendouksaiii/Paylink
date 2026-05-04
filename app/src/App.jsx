import { useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { RPC_URL } from './utils/constants';

// Wallet adapter default styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Pages
import Home from './pages/Home';
import Create from './pages/Create';
import Claim from './pages/Claim';
import Dashboard from './pages/Dashboard';

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="logo-icon">⚡</span>
        Paylink
      </Link>
      <div className="navbar-links">
        <Link to="/create" className="btn btn-ghost btn-sm">Send</Link>
        <Link to="/dashboard" className="btn btn-ghost btn-sm">My Links</Link>
        <WalletMultiButton />
      </div>
    </nav>
  );
}

export default function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Navbar />
          <main className="page">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<Create />} />
              <Route path="/c" element={<Claim />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
