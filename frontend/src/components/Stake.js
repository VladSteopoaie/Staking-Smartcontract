import React from "react";
import useContract from "../hooks/useContract";
// import { ethers } from "ethers"
const ethers = require("ethers");

function Stake({ account, amount }) {
  const { contract } = useContract();

  const stakeTokens = async () => {
    if (contract) {
      console.log(contract)
      const tx = await contract.stake({value: ethers.parseEther(amount)});
      await tx.wait();
      alert("Staked 1 token!");
    }
  };

  return <button onClick={stakeTokens}>Stake 1 Token</button>;
}

export default Stake;
