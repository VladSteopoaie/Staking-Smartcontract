import { ethers } from "hardhat";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const stakingContractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

  const StakingContract = await ethers.getContractFactory("StakingContract");
  const staking = StakingContract.attach(stakingContractAddress);
  console.log(`Connected to Staking contract at: ${staking.address}`);

  const [deployer, staker1, staker2, staker3] = await ethers.getSigners();

  console.log("Starting the staking process...");

  console.log(`Staker 1 (${staker1.address}) staking 151.21 ETH...`);
  await staking.connect(staker1).stake({ value: ethers.parseEther("151.21") });
  console.log("Staker 1 staked successfully.");
  await sleep(3000); 

  console.log(`Staker 2 (${staker2.address}) staking 287.33 ETH...`);
  await staking.connect(staker2).stake({ value: ethers.parseEther("287.33") });
  console.log("Staker 2 staked successfully.");
  await sleep(3000); 

  console.log(`Staker 3 (${staker3.address}) staking 70.09 ETH...`);
  await staking.connect(staker3).stake({ value: ethers.parseEther("70.09") });
  console.log("Staker 3 staked successfully.");

  console.log("All stakers have completed staking.");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
