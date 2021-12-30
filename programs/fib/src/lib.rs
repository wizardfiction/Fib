use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
mod fib {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let fibonacci = &mut ctx.accounts.fibonacci;
        fibonacci.previous = 0;
        fibonacci.current = 1;
        Ok(())
    }

    pub fn new_term(ctx: Context<NewTerm>) -> ProgramResult {
        let fibonacci = &mut ctx.accounts.fibonacci;
        let aux = fibonacci.current;
        fibonacci.current = fibonacci.current + fibonacci.previous;
        fibonacci.previous = aux;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 8)]
    pub fibonacci: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct NewTerm<'info> {
    #[account(mut)]
    pub fibonacci: Account<'info, MyAccount>,
}

#[account]
pub struct MyAccount {
    previous: u128,
    pub current: u128,
}
