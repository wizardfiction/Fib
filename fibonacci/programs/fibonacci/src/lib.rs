use anchor_lang::prelude::*;

declare_id!("7XMEmVc873gosEt5XAha2X7oPtVqb5K68xpGSwtCx6AQ");

#[program]
pub mod fibonacci {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let fibonacci = &mut ctx.accounts.fibonacci;
        fibonacci.authority = *ctx.accounts.authority.key;

        fibonacci.initialize()
    }

    pub fn increment(ctx: Context<Increment>) -> Result<()> {
        let fibonacci = &mut ctx.accounts.fibonacci;

        match fibonacci.safely_generate_next_fibonacci() {
            None =>
                err!(FibonacciError::IntegerOverflow),
            Some(result) =>
                fibonacci.store(result),
        }
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = authority)]
    pub fibonacci: Account<'info, Fibonacci>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Increment<'info> {
    #[account(mut, has_one = authority)]
    pub fibonacci: Account<'info, Fibonacci>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(Default)]
pub struct Fibonacci {
    pub authority: Pubkey,
    pub first_term: u8,
    pub second_term: u8,
    pub fib: u8,
}

impl Fibonacci {
    fn initialize(&mut self) -> Result<()> {
        self.first_term = 0;
        self.second_term = 1;
        Ok(())
    }

    fn safely_generate_next_fibonacci(&mut self) -> Option<u8> {
        self.first_term.checked_add(self.second_term)
    }

    fn store(&mut self, fib: u8) -> Result<()> {
            self.fib = fib;
            self.first_term = self.second_term;
            self.second_term = self.fib;
            Ok(())
    }
}

#[error_code]
pub enum FibonacciError {
    // Would have liked to interpolate the string to u8::MAX, but compiler doesn't seem to like it
    #[msg("Fibonacci can only hold integer values up to 2^8 - 1 = 255")]
    IntegerOverflow
}
