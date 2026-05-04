use anchor_lang::prelude::*;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, Transfer};

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod paylink {
    use super::*;

    /// Creates a new payment link by depositing tokens into an escrow PDA.
    ///
    /// The `claim_seed` is a random 32-byte value that:
    /// 1. Derives the escrow PDA address
    /// 2. Gets encoded as a UUID in the shareable URL
    ///
    /// Supports any SPL token (designed for USDC and USDT).
    pub fn create_link(
        ctx: Context<CreateLink>,
        amount: u64,
        claim_seed: [u8; 32],
        expiry_ts: i64,
    ) -> Result<()> {
        // Validate inputs
        require!(amount > 0, PaylinkError::ZeroAmount);
        require!(
            expiry_ts > Clock::get()?.unix_timestamp,
            PaylinkError::ExpiryInPast
        );

        // Initialize escrow state
        let escrow = &mut ctx.accounts.escrow_account;
        escrow.sender = ctx.accounts.sender.key();
        escrow.mint = ctx.accounts.token_mint.key();
        escrow.amount = amount;
        escrow.claim_seed = claim_seed;
        escrow.expiry_ts = expiry_ts;
        escrow.claimed = false;
        escrow.bump = ctx.bumps.escrow_account;

        // Transfer tokens: sender → escrow
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;

        emit!(LinkCreated {
            escrow: ctx.accounts.escrow_account.key(),
            sender: ctx.accounts.sender.key(),
            mint: ctx.accounts.token_mint.key(),
            amount,
            expiry_ts,
        });

        Ok(())
    }

    /// Claims escrowed tokens using the claim_seed derived from the URL.
    ///
    /// Anyone with the correct seed can claim before expiry.
    /// After claiming:
    /// - Tokens transfer to the recipient
    /// - Escrow token account is closed (rent → sender)
    /// - Escrow data account is closed (rent → sender)
    pub fn claim(
        ctx: Context<Claim>,
        claim_seed: [u8; 32],
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;

        require!(!escrow.claimed, PaylinkError::AlreadyClaimed);
        require!(
            Clock::get()?.unix_timestamp < escrow.expiry_ts,
            PaylinkError::LinkExpired
        );

        // Cache values before account closes
        let amount = escrow.amount;
        let mint = escrow.mint;
        let bump = escrow.bump;

        // Build PDA signer seeds
        let seeds = &[
            b"escrow".as_ref(),
            claim_seed.as_ref(),
            &[bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer tokens: escrow → recipient
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, amount)?;

        // Close escrow token account → rent returned to original sender
        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_token_account.to_account_info(),
                destination: ctx.accounts.sender.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            signer_seeds,
        );
        token::close_account(close_ctx)?;

        // Escrow data account is closed by Anchor's `close = sender` constraint

        emit!(LinkClaimed {
            escrow: ctx.accounts.escrow_account.key(),
            recipient: ctx.accounts.recipient.key(),
            mint,
            amount,
        });

        Ok(())
    }

    /// Reclaims escrowed tokens after the link has expired.
    ///
    /// Only the original sender can reclaim. After reclaiming:
    /// - Tokens return to the sender
    /// - Escrow token account is closed (rent → sender)
    /// - Escrow data account is closed (rent → sender)
    pub fn reclaim(
        ctx: Context<Reclaim>,
        claim_seed: [u8; 32],
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow_account;

        require!(!escrow.claimed, PaylinkError::AlreadyClaimed);
        require!(
            Clock::get()?.unix_timestamp >= escrow.expiry_ts,
            PaylinkError::NotYetExpired
        );

        // Cache values before account closes
        let amount = escrow.amount;
        let mint = escrow.mint;
        let bump = escrow.bump;

        // Build PDA signer seeds
        let seeds = &[b"escrow".as_ref(), claim_seed.as_ref(), &[bump]];
        let signer_seeds = &[&seeds[..]];

        // Transfer tokens: escrow → sender
        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.sender_token_account.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, amount)?;

        // Close escrow token account → rent returned to sender
        let close_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            CloseAccount {
                account: ctx.accounts.escrow_token_account.to_account_info(),
                destination: ctx.accounts.sender.to_account_info(),
                authority: ctx.accounts.escrow_account.to_account_info(),
            },
            signer_seeds,
        );
        token::close_account(close_ctx)?;

        // Escrow data account is closed by Anchor's `close = sender` constraint

        emit!(LinkReclaimed {
            escrow: ctx.accounts.escrow_account.key(),
            sender: ctx.accounts.sender.key(),
            mint,
            amount,
        });

        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Account state
// ---------------------------------------------------------------------------

#[account]
pub struct EscrowAccount {
    pub sender: Pubkey,       // 32 — original link creator
    pub mint: Pubkey,         // 32 — USDC or USDT mint address
    pub amount: u64,          // 8  — token amount (smallest unit)
    pub claim_seed: [u8; 32], // 32 — secret seed for PDA + URL
    pub expiry_ts: i64,       // 8  — unix timestamp when link expires
    pub claimed: bool,        // 1  — whether tokens have been claimed
    pub bump: u8,             // 1  — PDA bump seed
}
// Field total: 32 + 32 + 8 + 32 + 8 + 1 + 1 = 114 bytes
// With 8-byte discriminator: 122 bytes

impl EscrowAccount {
    pub const SIZE: usize = 114;
}

// ---------------------------------------------------------------------------
// Instruction contexts
// ---------------------------------------------------------------------------

#[derive(Accounts)]
#[instruction(amount: u64, claim_seed: [u8; 32])]
pub struct CreateLink<'info> {
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        init,
        payer = sender,
        space = 8 + EscrowAccount::SIZE,
        seeds = [b"escrow", claim_seed.as_ref()],
        bump
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(
        init,
        payer = sender,
        token::mint = token_mint,
        token::authority = escrow_account,
        seeds = [b"escrow-token", claim_seed.as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Sender's token account. Must match the sender's wallet and the target mint.
    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key()
            @ PaylinkError::InvalidTokenAccountOwner,
        constraint = sender_token_account.mint == token_mint.key()
            @ PaylinkError::MintMismatch,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    /// The SPL token mint (USDC or USDT).
    pub token_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(claim_seed: [u8; 32])]
pub struct Claim<'info> {
    /// The recipient claiming the link funds.
    pub recipient: Signer<'info>,

    /// The original sender. Receives rent from closed accounts.
    /// CHECK: Validated by `has_one = sender` constraint on escrow_account.
    #[account(mut)]
    pub sender: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"escrow", claim_seed.as_ref()],
        bump = escrow_account.bump,
        has_one = sender,
        close = sender,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(
        mut,
        seeds = [b"escrow-token", claim_seed.as_ref()],
        bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Recipient's token account. Must match recipient wallet and escrow mint.
    #[account(
        mut,
        constraint = recipient_token_account.owner == recipient.key()
            @ PaylinkError::InvalidTokenAccountOwner,
        constraint = recipient_token_account.mint == escrow_token_account.mint
            @ PaylinkError::MintMismatch,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(claim_seed: [u8; 32])]
pub struct Reclaim<'info> {
    /// The original sender reclaiming expired funds.
    #[account(mut)]
    pub sender: Signer<'info>,

    #[account(
        mut,
        seeds = [b"escrow", claim_seed.as_ref()],
        bump = escrow_account.bump,
        has_one = sender,
        close = sender,
    )]
    pub escrow_account: Account<'info, EscrowAccount>,

    #[account(
        mut,
        seeds = [b"escrow-token", claim_seed.as_ref()],
        bump,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    /// Sender's token account. Must match sender wallet and escrow mint.
    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key()
            @ PaylinkError::InvalidTokenAccountOwner,
        constraint = sender_token_account.mint == escrow_token_account.mint
            @ PaylinkError::MintMismatch,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

// ---------------------------------------------------------------------------
// Events — emitted for indexing and dashboard queries
// ---------------------------------------------------------------------------

#[event]
pub struct LinkCreated {
    pub escrow: Pubkey,
    pub sender: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub expiry_ts: i64,
}

#[event]
pub struct LinkClaimed {
    pub escrow: Pubkey,
    pub recipient: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct LinkReclaimed {
    pub escrow: Pubkey,
    pub sender: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[error_code]
pub enum PaylinkError {
    #[msg("This link has already been claimed.")]
    AlreadyClaimed,

    #[msg("This link has expired.")]
    LinkExpired,

    #[msg("Link has not yet expired.")]
    NotYetExpired,

    #[msg("Only the original sender can reclaim.")]
    Unauthorized,

    #[msg("Amount must be greater than zero.")]
    ZeroAmount,

    #[msg("Expiry timestamp must be in the future.")]
    ExpiryInPast,

    #[msg("Token account owner does not match expected wallet.")]
    InvalidTokenAccountOwner,

    #[msg("Token mint does not match the escrow mint.")]
    MintMismatch,
}
