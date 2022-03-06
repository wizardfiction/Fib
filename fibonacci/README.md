# Fibonacci Number Generator

**A fibonacci program, capable of sequentially generating and storing fibonacci numbers.**

My fibonacci program is responsible for mutating 3 fields on its owned account.

```
#[account]
#[derive(Default)]
pub struct Fibonacci {
    pub authority: Pubkey,
    pub first_term: u8,
    pub second_term: u8,
    pub fib: u8,
}
```

Additionally, we have designated that only a single authority can generate fibonacci numbers using the `has_one` constraint. This decision is fairly arbitrary for this contrived example, but allowed me to experiment with constraints a bit.

```
#[derive(Accounts)]
pub struct GenerateTerm<'info> {
    #[account(mut, has_one = authority)]
    pub fibonacci: Account<'info, Fibonacci>,
    pub authority: Signer<'info>,
}
```

### RPC Handlers

 ```
 pub fn initialize(ctx: Context<Initialize>) -> Result<()>;
 ```
 
 The call to `inititalize` is responsible for setting `first_term` and `second_term` to the first and second term of the fibonacci sequence, respectively.

```
generate_term(ctx: Context<GenerateTerm>) -> Result<()>;
```

Calls to `generate_term` use `first_term` and `second_term` to store `fib`, the next fibonacci number in the sequence. We then update `first_term` and `second_term`. 

While fibonacci numbers could be generated with only two primative variables, this approach allows clients to read the terms that comprise the current fibonacci number. Is this useful? Maybe.

Keeping track of the previous term ensures that each calculation can be performed in constant time/space.

### Error Handling

Rust provides a number of approaches when dealing with integer overflow. By default, the behavior is to perform two's complement wrapping. 

Using `u8` integers as an example, the max value is 2^8 - 1 = 255. Attempting to store 256 as a u8 would result in 0 being stored, observing Rust's two's complement wrapping at runtime. 

If the goal of our program is to sequentially provide fibonacci numbers, this wrapping behavior could cause clients to behave unexpectedly. As a result, I decided to define a custom error that prevents this type of overflow from occuring. This gives more determinism to clients of our program. It also let me learn a bit about custom errors in anchor. Another possible solution here could have been simply starting over at the first fibonacci number.

### Testing Approach

In order to test the correctness of the fibonacci program, I relied on a memoized fibonacci helper function (assumed to behave correctly). This could be extended to create a more comprehensive property testing strategy.

I was also interested in explicitly testing my boundary condition where integer overflow occurs. In order to easily produce this in my tests, I used unsigned 8-bit integers (u8). In practice we would probably like our program to support fibonacci numbers that are much bigger.

## Benchmarking Performance

A simple benchmarking technique was used for quantifying the amount of time to generate + read fibonacci numbers from a client interacting with the program via the IDL.

I am not an expert with node.js, and had concerns with accurately measuring the time it takes for asynchronous code to execute due to the complexity of the event loop/single threaded environment. 

Doing a bit of research, I decided to use [performance hooks](https://nodejs.org/api/perf_hooks.html), which is built into the node platform.


My client script can be invoked using the steps specified below:

*Terminal #1*
```
$ solana-test-validator
```

*Terminal #2*
```
$ anchor build

$ anchor deploy

$ ANCHOR_WALLET=<YOUR-KEYPAIR-PATH> node client.js <number of iterations>
```

***NOTE**: You will need to copy the program_id from the deploy step and paste it in place of <Program_ID> in client.js*

In order to test performance of my program with a meaningfully large number of iterations, I temporarily adjusted the data on my fibonacci account from `u8` to to `u128`.

It is also important to note that all of these benchmarks were run against a local validator node, which is not indicative of performance on mainnet.

I attempted to deploy my program to devnet, however I was unable to successfully airdrop any tokens to my wallet, preventing me from deploying my program. It seemed to be a commonly encountered issue, caused by devnet congestion.

Anyways, here are some results against my localnet:

```20 transactions completed, performing 2.1399339826031705 transactions per second```

```150 transactions completed, performing 2.12342038776243 transactions per second```

## An Aside On Docker + My Shitty React Application

Any time I need to guarantee determinism across multiple machines (as is the case with a code challenge), I try my best to dockerize my efforts to avoid the pain associated with subtle differences between the local environments of the people running my code.

I went ahead and attempted to orchestrate a local testing setup with docker-compose, but unfortunately ran into challenges with Anchor that left my deployment hanging, and never succeeding. I was able to successfully network between a container running a validator, and another container where I built my anchor program. After talking to some folks on the Discord, it looks like the current state of the anchor CLI won't allow me to achieve the result I wanted - deploying an anchor program in one container to a validator node running in another container. I *was* able to successfully airdrop tokens via the solana CLI, proving that the networking between containers did in fact work.

I've left the Dockerfile for building my program and running unit tests, but unfortunately I wasn't able to depoy with this method.

I also created a small react application to learn how to interact with my program wih a web wallet - phantom in this case. The plan was to run this inside the docker container where I deployed my program, but due to the issues with anchor CLI preventing my deploy, I was unable to.

You can run the react app wthout docker if you feel like dealing with all the shit that react so graciously installs via its node_modules on your local machine. Just make sure to copy the idl from your anchor target folder into the (currently empty) idl.json in the react app's src folder.  Docker would have also automated this nicely... When it rains it pours. 

Also don't forget to airdrop tokens to your phantom wallet on localhost.

the more I type, the more I feel like it isn't worth your time to run the react app...

## Alternative Architectural Considerations

When thinking about my program's interface, I initially considered the following:

```
pub fn fibonacci(ctx: Context<Initialize>, n: u64) -> Result<()>;
```
The above function could take an arbitrary input, n, and output the nth fibonacci number based on the input. 

Advantages of this approach:

- A client can directly access the nth fibonacci number F(n), rather than starting at F(0).

- Once results are stored, they can be accessed in constant time (with overhead of heap access)
  
Disadvantages to this approach:

- Calculating F(n) with simple recursion becomes computationally infeasable rather quickly. Solana programs are constrained to a [call depth](https://docs.solana.com/developing/on-chain-programs/overview#call-depth) of 64 stack frames, limiting our program's ability to calculate fibonacci numbers for anything beyond very small values of n.

- The computational expense of calculating the nth fibonacci number could be reduced significantly with a technique like memoization, but in order to store each intermediate result in our program's data, we would need to introduce a dynamically-sizable data structure, like a vector (non-primitive). Writing to the heap space requires the allocator to find enough available memory for the new data, and perform book-keeping for subsequent allocations. Additionally, reading is slower on the heap space because it relies on pointers to access the correct memory address. Relying on the heap space will slow down our program on both reads and writes. We also don't entirely escape the call depth issue, as our program will need to expand the call stack during "discovery" of new fibonacci numbers, i.e. when a client requests a fibonacci number that has not yet been stored in our data structure. Depending on how deep the call stack gets before reaching our previous highest stored result, the call depth could easily be exceeded.

An iterative approach to calculating the nth fibonacci number could overcome the issues with stack depth, but would still require a dynamically-sized data structure on the heap.