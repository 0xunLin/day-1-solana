import {
    createSolanaRpc,             // For connecting to the Solana network (mainnet, testnet, or devnet)
    devnet,                     // A constant specifying the Solana Devnet network environment
    generateKeyPair,            // Function to create a brand new digital identity (keypair)
    createKeyPairSignerFromBytes, // Creates a signer from a 64-byte array (32-byte secret + 32-byte public)
    createSignerFromKeyPair,    // Creates a signer from a high-quality keypair object
} from "@solana/kit";           // Import core Solana capabilities from the new Solana Kit (Web3.js v2)

import { readFile, writeFile } from "node:fs/promises"; // Import promise-based file system methods from Node.js

const WALLET_FILE = "wallet.json"; // Define the filename where the wallet data will be persisted locally
const rpc = createSolanaRpc(devnet("https://api.devnet.solana.com")); // Initialize a Devnet RPC client for blockchain communication

async function loadOrCreateWallet() { // Define an asynchronous function to manage wallet persistence
    try {                             // Start a try-catch block to handle existing or missing wallet files
        // Try to load an existing wallet from the local filesystem
        const data = JSON.parse(await readFile(WALLET_FILE, "utf-8")); // Read the JSON file and parse it into a JavaScript object
        const secretBytes = new Uint8Array(data.secretKey); // Convert the saved array into a standard Uint8Array for Solana
        const wallet = await createKeyPairSignerFromBytes(secretBytes); // Restore the signer using the saved bytes from the file
        console.log("Loaded existing wallet:", wallet.address); // Notify the user that an existing wallet was successfully restored
        return wallet; // Return the restored wallet object to be used elsewhere in the script
    } catch {          // If the try block fails (meaning the wallet file doesn't exist yet)
        // No wallet file found, create a brand new one
        // We pass `true` so the cryptographic keys are extractable for export and persistence
        const keyPair = await generateKeyPair(true); // Generates a secure, exportable Ed25519 keypair

        // Export the public key part using the 'raw' format
        const publicKeyBytes = new Uint8Array( // Creates a byte array to hold the public key
            await crypto.subtle.exportKey("raw", keyPair.publicKey) // Asynchronously exports the raw public key bytes
        );

        // Export the private key using the 'pkcs8' format (required by Node.js for Ed25519)
        const pkcs8 = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey); // Exports the private key in PKCS#8 format
        const privateKeyBytes = new Uint8Array(pkcs8).slice(-32); // Extracts the specific 32-byte seed from the end of the PKCS#8 data

        // Solana keypair format requires 64 bytes total: 32 bytes for the secret + 32 bytes for the public key
        const keypairBytes = new Uint8Array(64); // Allocate a 64-byte buffer for the full Solana-compatible keypair
        keypairBytes.set(privateKeyBytes, 0); // Place the 32 private key bytes at the start of the buffer (index 0)
        keypairBytes.set(publicKeyBytes, 32); // Place the 32 public key bytes in the second half of the buffer (index 32)

        await writeFile(                   // Asynchronously write the data to the local filesystem
            WALLET_FILE,                   // Target the file named "wallet.json"
            JSON.stringify({ secretKey: Array.from(keypairBytes) }) // Convert the bytes to a regular array and then to a JSON string
        );

        const wallet = await createSignerFromKeyPair(keyPair); // Create a usable signer object from the original in-memory keypair
        console.log("Create new wallet:", wallet.address); // Log the address of the newly minted wallet
        console.log(`Saved to ${WALLET_FILE}`); // Confirm to the user that their identity is now safely stored on disk
        return wallet; // Return the new wallet to finalize the setup
    }
}

const wallet = await loadOrCreateWallet(); // Execute the wallet manager and wait for the returned identity

// Check the current balance of the wallet on the blockchain
const { value: balance } = await rpc.getBalance(wallet.address).send(); // Request the balance from the RPC node specifically for this address
const balanceInSol = Number(balance) / 1_000_000_000; // Convert the tiny 'Lamports' unit into human-readable SOL (10^9 conversion)

console.log(`\nAddress: ${wallet.address}`); // Print the wallet's public address for the user to see
console.log(`Balance: ${balanceInSol} SOL`); // Print the wallet's current balance in SOL

if (balanceInSol === 0) { // Check if the wallet is currently empty
    console.log(          // Notify and guide the user on how to get test tokens
        `\nThis wallet has no SOL. Visit https://faucet.solana.com/ and airdrop some to:`
    );
    console.log(wallet.address); // Print the address clearly so the user can easily copy it into the faucet website
}