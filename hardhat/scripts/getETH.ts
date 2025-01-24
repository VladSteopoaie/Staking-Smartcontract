const { ethers } = require("hardhat");

async function main() {
  const recipientAddress = "0xDb93696c0f143573a14b48bfC40b0c665d236558";

  const signers = await ethers.getSigners();

  const sender = signers[0];
  console.log(`Sender Address: ${sender.address}`);

  const senderBalance = await ethers.provider.getBalance(sender.address);
  console.log(`Sender Balance: ${ethers.formatEther(senderBalance)} ETH`);

  const amountToSend = ethers.parseEther("519.78547");
  if (senderBalance < amountToSend) {
    console.error("Insufficient balance for transfer.");
    return;
  }

  const tx = await sender.sendTransaction({
    to: recipientAddress,
    value: amountToSend,
  });

  console.log(`Transaction Hash: ${tx.hash}`);
  console.log("Waiting for the transaction to be mined...");

  const receipt = await tx.wait();

  console.log("Transaction successful!");
  console.log(`Block Number: ${receipt.blockNumber}`);
  console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
