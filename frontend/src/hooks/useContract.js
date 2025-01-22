import { useState, useEffect } from "react";
// import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../constants/contract";
const ethers = require("ethers");

const useContract = () => {
  // const [provider, setProvider] = useState(null);
  // const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    async function prepareContract() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        // const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        // setProvider(web3Provider);
  
        const signer = await provider.getSigner();
        // setSigner(signer);
        console.log(signer);
  
        const stakingContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI.abi,
          signer
        );
  
        setContract(stakingContract);
      }
    }

    prepareContract();
  }, []);

  return { contract };
};

export default useContract;
