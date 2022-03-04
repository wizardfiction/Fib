
import * as anchor from '@project-serum/anchor';

const assert = require("assert");
const { SystemProgram } = anchor.web3;

describe("fibonacci", () => {
  const provider = anchor.Provider.local();

  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  // Counter for the tests.
  const counter = anchor.web3.Keypair.generate();

  // Program for the tests.
  const program = anchor.workspace.Fibonacci;

  it("Creates a counter", async () => {
    await program.rpc.initialize(new anchor.BN(0), {
      accounts: {
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [counter],
    });

    let counterAccount = await program.account.counter.fetch(counter.publicKey);

    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    assert.ok(counterAccount.count.toNumber() === 0);
  });

  it("Updates a counter", async () => {
    await program.rpc.increment({
      accounts: {
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
      },
    });

    const counterAccount = await program.account.counter.fetch(
      counter.publicKey
    );

    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    assert.ok(counterAccount.count.toNumber() == 1);
  });

  it("Updates a counter again", async () => {
    await program.rpc.increment({
      accounts: {
        counter: counter.publicKey,
        authority: provider.wallet.publicKey,
      },
    });

    const counterAccount = await program.account.counter.fetch(
      counter.publicKey
    );

    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    assert.ok(counterAccount.count.toNumber() == 2);
  });
});