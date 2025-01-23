import React from "react";
import useContract from "../hooks/useContract";
// import { ethers } from "ethers"
const ethers = require("ethers");

function Stake({ account, amount }) {
  const { contract } = useContract();

  const stakeTokens = async () => {
    if (contract) {
      try {
        const tx = await contract.stake({
          value: ethers.parseEther(amount),
          nonce: 0
        });
        await tx.wait();
        alert("Staked 1 token!");

      }
      catch (error)
      {
        console.error(error);
      }
    }
  };

  return <button onClick={stakeTokens}>Stake 1 Token</button>;
}

export default Stake;
