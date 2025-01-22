const { expect } = require("chai");
const { ethers } = require("hardhat");
import { time } from "@nomicfoundation/hardhat-network-helpers";


import { StakingContract__factory } from "../typechain-types";

describe("StakingContract Tests", function () {
  let StakingContract: any;
  let StakingContractFactory: any;
  let owner, user, andy, bob;

  before(async () => {
    [owner, user, andy, bob] = await ethers.getSigners();

    StakingContractFactory = (await ethers.getContractFactory(
      "StakingContract",
      owner
    )) as StakingContract__factory;
  });
  
  beforeEach(async function () {
    StakingContract = await StakingContractFactory.deploy("R_TOKEN", "RTK"); // Reward rate
    await StakingContract.waitForDeployment();
 });

  it("Testing the deployment parameters", async () => {
    expect(await StakingContract.name()).to.be.equals("R_TOKEN");
    expect(await StakingContract.symbol()).to.be.equals("RTK");
  });

  it("The owner should be DEFAULT_ADMIN_ROLE", async () => {
    let role = await StakingContract.DEFAULT_ADMIN_ROLE();

    let Admin = ethers.zeroPadValue(
      role,
      32
    );
    expect(
      await StakingContract.connect(owner).hasRole(Admin, owner.address)
    ).to.be.equal(true);
  });

  it("The contract should have minted the R_Tokens", async () => {
    expect(await StakingContract.balanceOf(StakingContract.target)).to.be.equal(
      BigInt("1022000000000000000000000")
    );
  });

  it("Testing the staking function", async () => {
    // Is the event emited?

    await expect(
      StakingContract.connect(andy).stake({
        value: ethers.parseEther("0.1"),
      })
    ).emit(StakingContract, "Stake")
     .withArgs(andy.address, ethers.parseEther("0.1"));

    // Does the balance of the contract change?
    expect(
      await ethers.provider.getBalance(StakingContract.target)
    ).to.be.equals(ethers.parseEther("0.1"));

    let role = await StakingContract.STAKER_ROLE();
    // Does the user received the STAKE_ROLE?
    let Staker = ethers.zeroPadValue(
      role,
      32
    );

    expect(
      await StakingContract.hasRole(Staker, andy.address)
    ).to.be.equal(true);

  });

  it("The user should stake multiple await time.", async () => {
    // First staking
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.1"),
    });
    // Second staking
    
    await time.increase(86400); // increase the await time.to 24h
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.15"),
    });

    await time.increase(86400 * 10); // increase the await time.to 24h * number of days
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.4"),
    });

    // Number of stakers should not change
    expect(await StakingContract.numberOfStakers()).to.be.equal(1);

  });
  
  it("The user shouldn't stake in the same day", async () => {
    // First staking
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.1"),
    });
    
    // Second staking
    
    await time.increase(86200); // increase the await time.to 24h
    await expect(StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.15"),
    })).to.be.revertedWith("You have to wait 1 day before you can take the action!");
    
  });
  
  it("Multiple users should stake and receive rewards", async() => {
    
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.1"),
    });
    
    await StakingContract.connect(bob).stake({
      value: ethers.parseEther("0.3"),
    });
    
    await time.increase(86400 * 2);
    await StakingContract.connect(user).stake({
      value: ethers.parseEther("0.3"),
    });
    // Also testing the variables from the contract
    expect(await StakingContract.numberOfStakers()).to.be.equal(3);
    expect(await StakingContract.totalAmountStaked()).to.be.equal(ethers.parseUnits("0.7"));


    expect(await StakingContract.connect(andy).viewRewards()).to.be.equal(ethers.parseUnits("1400"));
    expect(await StakingContract.connect(bob).viewRewards()).to.be.equal(ethers.parseEther("4200"))
    expect(await StakingContract.connect(user).viewRewards()).to.be.equal(ethers.parseEther("0"));
  });

  it("Testing the maximum stake amount", async() => {
    await StakingContract.connect(owner).stake({
      value: ethers.parseUnits("100")
    });
    await time.increase(86400 * 2);
    await StakingContract.connect(bob).stake({
      value: ethers.parseUnits("300")
    });
    await StakingContract.connect(andy).stake({
      value: ethers.parseUnits("250")
    });
    await time.increase(86400 * 2);
    await StakingContract.connect(user).stake({
      value: ethers.parseUnits("250")
    });
    await time.increase(86400 * 2);
    await StakingContract.connect(andy).stake({
      value: ethers.parseUnits("50")
    });

    await StakingContract.connect(owner).unstake(ethers.parseUnits("10"));
    
    await time.increase(86400 * 2);
    await expect (StakingContract.connect(owner).stake({
      value: ethers.parseUnits("70")
    }))
      .revertedWith("The maximum staked amount has been exceeded!");
  });

  it("Testing the unstake function", async () => {
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("10"),
    });
    await time.increase(86400 * 4);
    await expect(StakingContract.connect(andy).unstake(ethers.parseEther("3")))
    .emit(StakingContract, "Unstake").withArgs(andy.address, ethers.parseEther("3"));

    expect(
      await ethers.provider.getBalance(StakingContract.target)
    ).to.be.equals(ethers.parseEther("7"));

    // User should not have the staker role after unstaking all the funds
    // And should have the claimer role
    await time.increase(86400);
    await StakingContract.connect(andy).unstake(ethers.parseUnits("7"));

    let role = await StakingContract.STAKER_ROLE();
    let Staker = ethers.zeroPadValue(
      role,
      32
    );

    role = await StakingContract.CLAIMER_ROLE();
    let Claimer = ethers.zeroPadValue(
      role,
      32
    );
    
    expect(
      await StakingContract.hasRole(Staker, andy.address)
    ).to.be.equal(false);
    
    expect(
      await StakingContract.hasRole(Claimer, andy.address)
    ).to.be.equal(true);

  });

  it("Unstake errors", async() => {
    // User shouldn't be able to unstake before staking
    await expect (StakingContract.connect(andy).unstake(ethers.parseUnits("5"))).reverted;

    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("10"),
    });
    // User should't be able to unstake only after 24h
    await expect (StakingContract.connect(andy).unstake(ethers.parseUnits("5")))
    .revertedWith("You have to wait 1 day before you can take the action!");

    await time.increase(86400 * 2);
    
    // Insuficient balance
    await expect (StakingContract.connect(andy).unstake(ethers.parseUnits("11")))
    .revertedWith("Insuficient balance!");
    
    // Amount must be greater than 0
    await expect (StakingContract.connect(andy).unstake(ethers.parseUnits("0")))
    .revertedWith("Minimum value is 10000000000000000.");
    
    
  });

  it("Testing claimRewards function", async() => {
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.1"),
    });
    
    await StakingContract.connect(bob).stake({
      value: ethers.parseEther("0.2"),
    });
    
    await time.increase(86400 * 2);
    await StakingContract.connect(user).stake({
      value: ethers.parseEther("0.4"),
    });
    
    await StakingContract.connect(andy).stake({
      value: ethers.parseEther("0.3"),
    });
    await time.increase(86400 * 10);

    let rewardsAndy = await StakingContract.connect(andy).viewRewards();
    let rewardsBob = await StakingContract.connect(bob).viewRewards();
    let rewardsUser = await StakingContract.connect(user).viewRewards();

    await expect(StakingContract.connect(andy).claimRewards())
    .emit(StakingContract, "ClaimRewards").withArgs(andy.address, rewardsAndy);
    await expect(StakingContract.connect(bob).claimRewards())
    .emit(StakingContract, "ClaimRewards").withArgs(bob.address, rewardsBob);
    await expect(StakingContract.connect(user).claimRewards())
    .emit(StakingContract, "ClaimRewards").withArgs(user.address, rewardsUser);

    expect(await StakingContract.balanceOf(andy.address)).to.be.equal(rewardsAndy);
    expect(await StakingContract.balanceOf(bob.address)).to.be.equal(rewardsBob);
    expect(await StakingContract.balanceOf(user.address)).to.be.equal(rewardsUser);

    await time.increase(86400 * 3);
    // After unstake and claim user should not have claim role
    await StakingContract.connect(andy).unstake(ethers.parseUnits("0.4"));
    
    await StakingContract.connect(andy).claimRewards();

    let role = await StakingContract.CLAIMER_ROLE();
    let Claimer = ethers.zeroPadValue(
      role,
      32
    );
    
    expect(
      await StakingContract.hasRole(Claimer, andy.address)
    ).to.be.equal(false);
  

  });

  it("Claiming rewards errors", async() => {
    // User cannot claim without staking
    await expect(StakingContract.connect(andy).claimRewards()).revertedWith("Not eligible to claim rewards!");
    
    // User cannot claim right after staking
    await StakingContract.connect(andy).stake({
      value: ethers.parseUnits("10")
    });
    await time.increase(86380); // the limit is 24h after that the user can claim
    await expect(StakingContract.connect(andy).claimRewards()).revertedWith("No rewards to claim!");
    
    await time.increase(86400); // now the user can claim
    await StakingContract.connect(andy).claimRewards();
    // user should not be able to claim right after another claim
    await expect(StakingContract.connect(andy).claimRewards()).revertedWith("No rewards to claim!");
    
    await time.increase(86400 * 10);
    
    await StakingContract.connect(andy).unstake(ethers.parseUnits("10"));
    
    await StakingContract.connect(andy).claimRewards();
    
    await expect(StakingContract.connect(andy).claimRewards()).revertedWith("Not eligible to claim rewards!");
    await time.increase(86400 * 7);
    // if the user claims rewards and after unstakes, they should be able to claim once more but 0 rewards
    
    await StakingContract.connect(andy).stake({
      value: ethers.parseUnits("10")
    });
    
    await time.increase(86400 * 10);
    
    await StakingContract.connect(andy).claimRewards();
    await StakingContract.connect(andy).unstake(ethers.parseUnits("10"));
    await expect(StakingContract.connect(andy).claimRewards()).revertedWith("Not eligible to claim rewards!");

  });

});
