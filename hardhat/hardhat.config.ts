require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers")
require("solidity-coverage");
require("dotenv").config();


module.exports = {
  solidity: "0.8.28",
  paths: {
    artifacts: "./artifacts"
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      // address: 0xC99C12Ce634745510FE5be34504F7eDbbC244Ffc
    },
  },
};