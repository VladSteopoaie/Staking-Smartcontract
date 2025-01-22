import React from "react";
// import { ethers } from "ethers";

function ConnectWallet({ setAccount }) {
  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } else {
      alert("Install Metamask");
    }
  };

  return <button onClick={connectWallet}>Connect Wallet</button>;
}

export default ConnectWallet;
