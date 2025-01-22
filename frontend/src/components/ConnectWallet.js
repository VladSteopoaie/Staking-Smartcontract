import React from "react";

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

  return <button className="btn btn-warning" onClick={connectWallet}>Connect</button>;
}

export default ConnectWallet;
