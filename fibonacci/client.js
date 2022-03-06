const anchor = require("@project-serum/anchor");
const { performance } = require('perf_hooks');
const { start } = require("repl");

const { SystemProgram, PublicKey, Keypair } = anchor.web3;

// Configure the local cluster.

anchor.setProvider(anchor.Provider.local("http://127.0.0.1:8899"));

const iterations = process.argv[2];
console.log("Running client.");

main(iterations).then(() => console.log("Success"));

async function main(iterations) {
  // Read the generated IDL.
  const idl = JSON.parse(
    require("fs").readFileSync("./target/idl/fibonacci.json", "utf8")
  );

  // Address of the deployed program.
  const programId = new PublicKey("7XMEmVc873gosEt5XAha2X7oPtVqb5K68xpGSwtCx6AQ");

  // Generate the program client from IDL.
  const program = new anchor.Program(idl, programId);

  const fibonacci = Keypair.generate();

  // Initialize the fibonacci generator

  await initialize(fibonacci, program);

  // Benchmarks the generator

  await benchmark(iterations, increment, [fibonacci, program]);

}

async function initialize(fibonacci, program) {
  await program.rpc.initialize({
    accounts: {
      fibonacci: fibonacci.publicKey,
      authority: program.provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [fibonacci],
  });
}

async function increment(fibonacci, program) {
    // generate next fibonacci number
    await program.rpc.increment({
      accounts: {
        fibonacci: fibonacci.publicKey,
        authority: program.provider.wallet.publicKey,
      }
    })
    
    // read account data
    await program.account.fibonacci.fetch(fibonacci.publicKey);
}

async function benchmark(iterations, fn, args) {
  let startTime = performance.now();

  for(let i = 0; i < iterations; i++) {
    await fn.apply(this, args);
  }

  let endTime = performance.now();

  let transactions_per_second = tps(iterations, startTime, endTime);

  result_formatter(iterations, transactions_per_second);

}

function tps(iterations, startTime, endTime) {
  const total_time_seconds  = (endTime - startTime) / 1000;

  return iterations / total_time_seconds;
}

function result_formatter(iterations, tps) {
  console.log(`${iterations} transactions completed, performing ${tps} transactions per second`);
}
