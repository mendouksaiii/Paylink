import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import { AnchorProvider, Program, BN, Wallet } from '@coral-xyz/anchor';
import { IDL, getEscrowPDA, getEscrowTokenPDA } from '@/lib/program';
import { PROGRAM_ID, RPC_URL } from '@/lib/constants';

/**
 * POST /api/execute-claim
 *
 * Server-side claim execution for recipients who don't have wallets.
 * After OTP verification, this route uses a server relayer keypair to
 * execute the on-chain `claim` instruction on behalf of the recipient.
 *
 * The claimed tokens go into the relayer's ATA, and MoonPay handles
 * the off-ramp from there.
 *
 * Requires RELAYER_PRIVATE_KEY in env (base64-encoded 64-byte keypair).
 */
export async function POST(req: NextRequest) {
  try {
    const { claimId, sessionToken } = await req.json();

    if (!claimId || !sessionToken) {
      return NextResponse.json(
        { error: 'claimId and sessionToken required' },
        { status: 400 }
      );
    }

    // 1. Verify session token matches
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('*')
      .eq('id', claimId)
      .eq('session_token', sessionToken)
      .eq('status', 'verified')
      .single();

    if (claimError || !claim) {
      return NextResponse.json(
        { error: 'Invalid session or claim already processed' },
        { status: 401 }
      );
    }

    // 2. Load relayer keypair
    const relayerKey = process.env.RELAYER_PRIVATE_KEY;
    if (!relayerKey) {
      console.error('RELAYER_PRIVATE_KEY not configured');
      // In development/hackathon mode, just mark as claimed without on-chain execution
      await supabase
        .from('claims')
        .update({ status: 'claimed' })
        .eq('id', claimId);

      return NextResponse.json({
        ok: true,
        mode: 'simulated',
        message: 'Claim recorded (no relayer configured — simulated mode)',
      });
    }

    const relayerKeypair = Keypair.fromSecretKey(
      Buffer.from(relayerKey, 'base64')
    );

    // 3. Set up Anchor
    const connection = new Connection(RPC_URL, 'confirmed');
    const wallet = {
      publicKey: relayerKeypair.publicKey,
      signTransaction: async (tx: any) => { tx.sign(relayerKeypair); return tx; },
      signAllTransactions: async (txs: any[]) => { txs.forEach(tx => tx.sign(relayerKeypair)); return txs; },
    } as unknown as Wallet;

    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const program = new Program(IDL as any, new PublicKey(PROGRAM_ID), provider);

    // 4. Reconstruct seed and derive PDAs
    const seedBytes = new Uint8Array(
      claim.claim_seed.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
    );
    const [escrowPDA] = getEscrowPDA(seedBytes);
    const [escrowTokenPDA] = getEscrowTokenPDA(seedBytes);

    // 5. Fetch escrow to get mint and sender
    const escrow = await program.account.escrowAccount.fetch(escrowPDA);
    const mint = escrow.mint as PublicKey;
    const sender = escrow.sender as PublicKey;

    // 6. Get or create relayer's ATA for this mint
    const recipientATA = await getAssociatedTokenAddress(
      mint,
      relayerKeypair.publicKey
    );
    const recipientATAInfo = await connection.getAccountInfo(recipientATA);

    const preInstructions = [];
    if (!recipientATAInfo) {
      preInstructions.push(
        createAssociatedTokenAccountInstruction(
          relayerKeypair.publicKey, // payer
          recipientATA,             // ata
          relayerKeypair.publicKey, // owner
          mint                      // mint
        )
      );
    }

    // 7. Execute on-chain claim
    const tx = await program.methods
      .claim(Array.from(seedBytes))
      .accounts({
        recipient: relayerKeypair.publicKey,
        sender: sender,
        escrowAccount: escrowPDA,
        escrowTokenAccount: escrowTokenPDA,
        recipientTokenAccount: recipientATA,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .preInstructions(preInstructions)
      .signers([relayerKeypair])
      .rpc({ commitment: 'confirmed' });

    // 8. Update Supabase
    await supabase
      .from('claims')
      .update({
        status: 'claimed',
        claim_tx: tx,
      })
      .eq('id', claimId);

    return NextResponse.json({
      ok: true,
      mode: 'on-chain',
      txSignature: tx,
      amount: escrow.amount.toString(),
    });
  } catch (err) {
    console.error('execute-claim error:', err);
    return NextResponse.json(
      { error: 'Claim execution failed' },
      { status: 500 }
    );
  }
}
