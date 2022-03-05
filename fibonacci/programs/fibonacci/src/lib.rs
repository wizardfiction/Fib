use anchor_lang::prelude::*;

declare_id!("AzhpMgr3apBd5K3WzLMWZudHjhMPoxfH6qACrRNUPBvp");

// const MAXIMUM_SIZE: u8 = u8::MAX;

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

        match fibonacci.first_term.checked_add(fibonacci.second_term) {
            None =>
                err!(FibonacciError::IntegerOverflow),
            Some(result) =>
                fibonacci.generate(result),
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

    fn generate(&mut self, fib: u8) -> Result<()> {
            self.fib = fib;
            self.first_term = self.second_term;
            self.second_term = self.fib;
            Ok(())
    }
}

#[error_code]
pub enum FibonacciError {
    #[msg("Fibonacci can only hold integer values up to ur mom")]
    IntegerOverflow
}
