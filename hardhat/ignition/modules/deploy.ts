import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StakingModule = buildModule("StakingModule", (m) => {
  // Pass constructor arguments for the "StakingContract"
  const stakingContract = m.contract("StakingContract", [
    "R_TOKEN", // Replace with your desired token name
    "RTK", // Replace with your desired token symbol
  ]);

  return { stakingContract };
});

export default StakingModule;
