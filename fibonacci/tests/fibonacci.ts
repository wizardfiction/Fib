import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Fibonacci } from "../target/types/fibonacci";
import { expect } from 'chai';

const { SystemProgram } = anchor.web3;

interface Cache {
  [key: number]: number;
}

function getNthFibonacci(n: number, memoize: Cache = {1: 0, 2: 1}) {
  if (n in memoize) {
    return memoize[n];
  } else {
    memoize[n] = getNthFibonacci(n - 1, memoize) + getNthFibonacci(n - 2, memoize);
    return memoize[n];
  }
}

describe("fibonacci", () => {

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  // Program for the tests.
  const program = anchor.workspace.Fibonacci as Program<Fibonacci>;

  // Fibonacci for the tests.
  const fibonacci = anchor.web3.Keypair.generate();


  it("Initializes the program with the first two fibonacci terms", async () => {
    await program.rpc.initialize({
      accounts: {
        fibonacci: fibonacci.publicKey,
        authority: program.provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [fibonacci],
    });

    let fibonacciAccount = await program.account.fibonacci.fetch(fibonacci.publicKey);

    expect(fibonacciAccount.authority).to.eql(program.provider.wallet.publicKey);
    expect(fibonacciAccount.firstTerm).to.equal(0);
    expect(fibonacciAccount.secondTerm).to.equal(1);
  });

  it("Generates the next n fibonacci numbers", async () => {
    // Generate the first 12 fibonacci numbers
    let n = 12;
    let fibonacciAccount;

    for(let i = 1; i <= n; i++) {
      await program.rpc.generateTerm({
        accounts: {
          fibonacci: fibonacci.publicKey,
          authority: program.provider.wallet.publicKey
        }
      });

      fibonacciAccount = await program.account.fibonacci.fetch(fibonacci.publicKey);

      expect(fibonacciAccount.authority).to.eql(program.provider.wallet.publicKey);

      // Since our Fibonacci account is initialized with the first two terms,
      // we will need to supply i+2 to our getNthFibonacci function
      expect(fibonacciAccount.fib).to.equal(getNthFibonacci(i + 2));
    }
  })

  it("Returns an IntegerOverflow error on the next fibonacci number", async () => {
    try {
      await program.rpc.generateTerm({
        accounts: {
          fibonacci: fibonacci.publicKey,
          authority: program.provider.wallet.publicKey
        }
      });
      // ensure that an error is thrown
      chai.assert(false, "Should have failed for integer overflow")
    } catch (error) {
      expect(error.code).to.equal(6000);
    }
  })
});