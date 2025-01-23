import { useState, useEffect } from "react";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../constants/contract";
const ethers = require("ethers");

const useContract = () => {
  const [contract, setContract] = useState(null);

  useEffect(() => {
    async function prepareContract() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
  
        const signer = await provider.getSigner();
  
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
