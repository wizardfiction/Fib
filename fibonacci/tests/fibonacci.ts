import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Fibonacci } from "../target/types/fibonacci";

describe("fibonacci", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.Fibonacci as Program<Fibonacci>;
  console.log(program);

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
