import { generateKeyPairSigner, createSolanaRpc, devnet, address } from "@solana/kit"; // Import core functions and helpers from the Solana Kit library

const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com")); // Create a connection client for the Solana Devnet environment
const wallet = await generateKeyPairSigner(); // Asynchronously generate a new cryptographic keypair (your digital identity)

console.log("Wallet address:", wallet.address); // Log the public address of the new wallet to the terminal
console.log("\n- Go to https://faucet.solana.com/ and airdrop SOL to this address -"); // Print instructions for using the web faucet
console.log("- Then run this script again with the same address to check the balance -\n"); // Advise on how to verify the funding in the next run

// This line fetches the current balance for a specific address using the RPC connection
const { value: balance } = await rpc.getBalance(address("FQFXfJ7wkw84UBZTgjCtM3MWVZGpSgSjKwnJY6gJaRkD")).send();

// const { value: balance } = await rpc.getBalance(wallet.address).send(); // Hook for checking the balance of the freshly generated wallet
const balanceInSol = Number(balance) / 1_000_000_000; // Convert the balance value from Lamports to human-readable SOL

console.log(`Balance: ${balanceInSol} SOL`); // Display the final balance result in the console

/** 
 * Note: generateKeyPairSigner() creates a new keypair every time. 
 * To check a previously funded address, pass it into the address() helper.
 * We'll cover saving and loading keys on Day 2.
 */