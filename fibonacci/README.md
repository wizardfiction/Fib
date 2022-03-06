# Fibonacci Number Generator


## Architecture

**A fibonacci program, capable of sequentially generating and storing fibonacci numbers.**

When thinking about my program's interface, I initially considered the following:

```
pub fn fibonacci(ctx: Context<Initialize>, n: u64) -> Result<()> {

  ...

}
```
The above function could take an arbitrary input, n, and output the nth fibonacci number based on the input. 

Advantages of this approach:

- A client can directly access the nth fibonacci number F(n), rather than starting at F(0).
  
Disadvantages to this approach:

- Calculating F(n) with simple recursion becomes computationally infeasable rather quickly. Solana programs are constrained to a [call depth](https://docs.solana.com/developing/on-chain-programs/overview#call-depth) of 64 stack frames, limiting our program's ability to calculate fibonacci numbers for anything beyond very small values of n.

- The computational expense of calculating the nth fibonacci number could be reduced significantly with a technique like memoization, but in order to store each intermediate result in our program's data, we would need to introduce a dynamically-sizable data structure, like a vector (non-primitive). Writing to the heap space requires the allocator to find enough available memory for the new data, and perform book-keeping for subsequent allocations. Additionally, reading is slower on the heap space because it relies on pointers to access the correct memory address. Relying on the heap space will slow down our program on both reads and writes. We also don't entirely escape the call depth issue, as our program will need to expand the call stack during "discovery" of new fibonacci numbers, i.e. when a client requests a fibonacci number that has not yet been stored in our data structure. Depending on how deep the call stack gets before reaching our previous highest stored result, the call depth could easily be exceeded.
