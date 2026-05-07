/**
 * Paylink — usePaylink Hook
 *
 * Provides createLink, claimLink, reclaimLink, fetchEscrow, and fetchSenderLinks
 * functions that interact with the on-chain Paylink program.
 */
import { useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { getProgram, getEscrowPDA, getEscrowTokenPDA, getErrorMessage } from '@/lib/program';
import { PROGRAM_ID } from '@/lib/constants';

const programId = new PublicKey(PROGRAM_ID);

export function usePaylink() {
  const { connection } = useConnection();
  const wallet = useWallet();

  /**
   * Create a new payment link.
   * Deposits tokens into an escrow PDA.
   */
  const createLink = useCallback(async ({ claimSeed, amount, expiryTs, mintAddress }: { claimSeed: Uint8Array; amount: number; expiryTs: number; mintAddress: string }) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const program = getProgram(connection, wallet);
    const mint = new PublicKey(mintAddress);
    const seedArray = Array.from(claimSeed);

    // Derive PDAs
    const [escrowPDA] = getEscrowPDA(claimSeed);
    const [escrowTokenPDA] = getEscrowTokenPDA(claimSeed);

    // Get sender's associated token account
    const senderATA = await getAssociatedTokenAddress(mint, wallet.publicKey);

    // Check sender has the ATA
    const senderATAInfo = await connection.getAccountInfo(senderATA);
    if (!senderATAInfo) {
      throw new Error(`You don't have a ${mint.toString()} token account. Please fund your wallet first.`);
    }

    const tx = await program.methods
      .createLink(
        new BN(amount),
        seedArray,
        new BN(expiryTs)
      )
      .accounts({
        sender: wallet.publicKey,
        escrowAccount: escrowPDA,
        escrowTokenAccount: escrowTokenPDA,
        senderTokenAccount: senderATA,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc({ commitment: 'confirmed' });

    return { txSignature: tx, escrowPDA, escrowTokenPDA };
  }, [connection, wallet]);

  /**
   * Claim escrowed tokens using the claim seed from the URL.
   * Auto-creates recipient's ATA if needed.
   */
  const claimLink = useCallback(async ({ claimSeed }: { claimSeed: Uint8Array }) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const program = getProgram(connection, wallet);
    const seedArray = Array.from(claimSeed);

    // Derive PDAs
    const [escrowPDA] = getEscrowPDA(claimSeed);
    const [escrowTokenPDA] = getEscrowTokenPDA(claimSeed);

    // Fetch escrow to get mint and sender
    const escrow = await (program.account as any).escrowAccount.fetch(escrowPDA);
    const mint = escrow.mint;
    const sender = escrow.sender;

    // Get or create recipient's ATA
    const recipientATA = await getAssociatedTokenAddress(mint, wallet.publicKey);
    const recipientATAInfo = await connection.getAccountInfo(recipientATA);

    // Build instruction list
    const preInstructions = [];
    if (!recipientATAInfo) {
      preInstructions.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,  // payer
          recipientATA,      // ata
          wallet.publicKey,  // owner
          mint               // mint
        )
      );
    }

    const tx = await program.methods
      .claim(seedArray)
      .accounts({
        recipient: wallet.publicKey,
        sender: sender,
        escrowAccount: escrowPDA,
        escrowTokenAccount: escrowTokenPDA,
        recipientTokenAccount: recipientATA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(preInstructions)
      .rpc({ commitment: 'confirmed' });

    return {
      txSignature: tx,
      amount: escrow.amount.toString(),
      mint: mint.toString(),
    };
  }, [connection, wallet]);

  /**
   * Reclaim expired escrow tokens back to the sender.
   */
  const reclaimLink = useCallback(async ({ claimSeed }: { claimSeed: Uint8Array }) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const program = getProgram(connection, wallet);
    const seedArray = Array.from(claimSeed);

    // Derive PDAs
    const [escrowPDA] = getEscrowPDA(claimSeed);
    const [escrowTokenPDA] = getEscrowTokenPDA(claimSeed);

    // Fetch escrow to get mint
    const escrow = await (program.account as any).escrowAccount.fetch(escrowPDA);
    const mint = escrow.mint;

    // Get sender's ATA
    const senderATA = await getAssociatedTokenAddress(mint, wallet.publicKey);

    const tx = await program.methods
      .reclaim(seedArray)
      .accounts({
        sender: wallet.publicKey,
        escrowAccount: escrowPDA,
        escrowTokenAccount: escrowTokenPDA,
        senderTokenAccount: senderATA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc({ commitment: 'confirmed' });

    return { txSignature: tx };
  }, [connection, wallet]);

  /**
   * Fetch a single escrow account by claim seed.
   * Returns null if the account doesn't exist (claimed/closed or never created).
   */
  const fetchEscrow = useCallback(async (claimSeed: Uint8Array) => {
    const program = getProgram(connection, wallet);
    const [escrowPDA] = getEscrowPDA(claimSeed);

    try {
      const escrow = await (program.account as any).escrowAccount.fetch(escrowPDA);
      return {
        sender: escrow.sender.toString(),
        mint: escrow.mint.toString(),
        amount: escrow.amount.toString(),
        claimSeed: escrow.claimSeed,
        expiryTs: escrow.expiryTs.toNumber(),
        claimed: escrow.claimed,
        bump: escrow.bump,
        address: escrowPDA.toString(),
      };
    } catch {
      return null;
    }
  }, [connection, wallet]);

  /**
   * Fetch all escrow accounts where sender matches the connected wallet.
   * Uses getProgramAccounts with a memcmp filter on the sender field.
   */
  const fetchSenderLinks = useCallback(async () => {
    if (!wallet.publicKey) return [];

    const accounts = await connection.getProgramAccounts(programId, {
      commitment: 'confirmed',
      filters: [
        { dataSize: 122 }, // 8 discriminator + 114 data
        {
          memcmp: {
            offset: 8, // after discriminator, sender is first field
            bytes: wallet.publicKey.toBase58(),
          },
        },
      ],
    });

    return accounts.map(({ pubkey, account }) => {
      const data = account.data;
      // Manual deserialization matching EscrowAccount layout
      // Skip 8 bytes discriminator
      const sender = new PublicKey(data.slice(8, 40));
      const mint = new PublicKey(data.slice(40, 72));
      const amount = data.readBigUInt64LE(72);
      const claimSeed = data.slice(80, 112);
      const expiryTs = Number(data.readBigInt64LE(112));
      const claimed = data[120] === 1;
      const bump = data[121];

      return {
        address: pubkey.toString(),
        sender: sender.toString(),
        mint: mint.toString(),
        amount: amount.toString(),
        claimSeed: Array.from(claimSeed),
        expiryTs,
        claimed,
        bump,
      };
    });
  }, [connection, wallet.publicKey]);

  return {
    createLink,
    claimLink,
    reclaimLink,
    fetchEscrow,
    fetchSenderLinks,
    getErrorMessage,
  };
}

