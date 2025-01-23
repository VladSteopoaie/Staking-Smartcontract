const { ethers } = require("hardhat");

async function main() {
  // Replace with your recipient address
  const recipientAddress = "0xDb93696c0f143573a14b48bfC40b0c665d236558";

  // Get signers (accounts) from the Hardhat network
  const signers = await ethers.getSigners();

  // Use the first signer (or another one with ETH) as the sender
  const sender = signers[0];
  console.log(`Sender Address: ${sender.address}`);

  // Check sender's balance
  const senderBalance = await ethers.provider.getBalance(sender.address);
  console.log(`Sender Balance: ${ethers.formatEther(senderBalance)} ETH`);

  // Ensure the sender has enough ETH to transfer (adjust the amount as needed)
  const amountToSend = ethers.parseEther("1.78547"); // 1 ETH
  if (senderBalance < amountToSend) {
    console.error("Insufficient balance for transfer.");
    return;
  }

  // Create a transaction
  const tx = await sender.sendTransaction({
    to: recipientAddress,
    value: amountToSend,
  });

  console.log(`Transaction Hash: ${tx.hash}`);
  console.log("Waiting for the transaction to be mined...");

  // Wait for the transaction to be mined
  const receipt = await tx.wait();

  console.log("Transaction successful!");
  console.log(`Block Number: ${receipt.blockNumber}`);
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
