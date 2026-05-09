'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';
import { TOKENS, getTokenMint } from '@/lib/tokens';

export interface Balances {
  sol: number;
  usdc: number;
  usdt: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useBalances(): Balances {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [sol, setSol] = useState(0);
  const [usdc, setUsdc] = useState(0);
  const [usdt, setUsdt] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchTokenBalance = useCallback(
    async (mint: PublicKey, decimals: number): Promise<number> => {
      if (!publicKey) return 0;
      try {
        const ata = await getAssociatedTokenAddress(mint, publicKey);
        const info = await connection.getAccountInfo(ata);
        if (!info) return 0;
        const bal = await connection.getTokenAccountBalance(ata);
        return Number(bal.value.amount) / Math.pow(10, decimals);
      } catch {
        return 0;
      }
    },
    [connection, publicKey]
  );

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setSol(0); setUsdc(0); setUsdt(0);
      return;
    }
    setLoading(true);
    try {
      const [solLamports, usdcBal, usdtBal] = await Promise.all([
        connection.getBalance(publicKey),
        fetchTokenBalance(getTokenMint('USDC'), TOKENS.USDC.decimals),
        fetchTokenBalance(getTokenMint('USDT'), TOKENS.USDT.decimals),
      ]);
      setSol(solLamports / LAMPORTS_PER_SOL);
      setUsdc(usdcBal);
      setUsdt(usdtBal);
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, fetchTokenBalance]);

  useEffect(() => {
    refresh();
    if (!publicKey) return;
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, [publicKey, refresh]);

  return { sol, usdc, usdt, loading, refresh };
}
