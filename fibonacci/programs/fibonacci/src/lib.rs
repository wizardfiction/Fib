use anchor_lang::prelude::*;

declare_id!("AzhpMgr3apBd5K3WzLMWZudHjhMPoxfH6qACrRNUPBvp");

#[program]
pub mod fibonacci {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
