import React, { useEffect, useState } from "react";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../constants/contract";
const { ethers } = require("ethers");

function Dashboard({ account }) {
    const [contract, setContract] = useState(null);
    const [provider, setProvider] = useState();
    const [balanceInEther, setBalanceInEther] = useState(0);
    const [balanceInUSD, setBalanceInUSD] = useState(0);
    const [stakedUSD, setStakedUSD] = useState(0);
    const [stakerInfo, setStakerInfo] = useState({
        amountStaked: 0,
        rewards: 0,
        lastStaked: 0,
        totalAmountStaked: 0,
    });
    const [userShare, setUserShare] = useState();
    const [totalShare, setTotalShare] = useState();
    const [toStakeAmount, setToStakeAmount] = useState(0);
    const [stakeCooldown, setStakeCooldown] = useState(false);

    const formatter = new Intl.NumberFormat('en-US');

    const handleToStake = (event) => {
        setToStakeAmount(event.target.value);
    }

    useEffect(() => {
        const manageAccount = async () => {
            if (account) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                setProvider(provider);
                const signer = await provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);
                setContract(contract);
            }
            else 
            {
                setProvider(null);
                setContract(null);
            }
        }
        manageAccount();
    }, [account]);

    useEffect(() => {
        if (provider && contract) {
            refreshValues();

            const setupEventListener = async () => {
                // Set up the event listener
                contract.on("Stake", (user, amount) => {
                    console.log("Stake");
                    refreshValues();
                });
                contract.on("Unstake", (user, amount) => {
                    console.log("Unstake");
                    refreshValues();
                });
                contract.on("ClaimRewards", (user, amount) => {
                    console.log("ClaimRewards");
                    refreshValues();
                });

                return () => {
                    contract.removeAllListeners("Stake");
                    contract.removeAllListeners("Unstake");
                    contract.removeAllListeners("ClaimRewards");
                };
            };

            setupEventListener();
        }
    }, [provider, contract]);

    useEffect(() => {
        if (stakerInfo.totalAmountStaked === 0)
        {
            setUserShare(0);
            setTotalShare(0);
            return;
        }

        setUserShare((stakerInfo.amountStaked / 10).toFixed(2));
        setTotalShare(((stakerInfo.totalAmountStaked - stakerInfo.amountStaked) / 10).toFixed(2));
    }, [stakerInfo]);
    
    const refreshValues = async () => {
        await getWalletBalance();
        await getContractInfo();
    }

    const getContractInfo = async () => {
        if (contract)
        {
            try {
                // Call the viewInfo function
                const [
                    amountStaked,
                    rewards,
                    lastStaked,
                    totalAmountStaked,
                ] = await contract.viewInfo();

                // Update state with the fetched data
                setStakerInfo({
                    amountStaked: Number(ethers.formatEther(amountStaked)), // Convert from Wei
                    rewards: Number(ethers.formatEther(rewards)),
                    lastStaked: Number(lastStaked) * 1000, // Convert in ms
                    totalAmountStaked: Number(ethers.formatEther(totalAmountStaked)),
                });

                const oneDayInMs = 24 * 60 * 60 * 1000; // Milliseconds in a day
                const block = await provider.getBlock(await provider.getBlockNumber());
                const now = block.timestamp * 1000; // Current time in milliseconds

                // Check if one day has passed
                console.log(now, Number(lastStaked) * 1000, now - Number(lastStaked) * 1000, oneDayInMs);
                if (now - Number(lastStaked) * 1000 >= oneDayInMs) {
                   setStakeCooldown(false);
                } else {
                   setStakeCooldown(true);
                }

                setStakedUSD(await etherToUSD(Number(ethers.formatEther(amountStaked))));
            } catch (error) {
                console.error("Error fetching staker info:", error);
            }
        }
    }

    const etherToUSD = async (etherAmount) =>
    {
        let ratio = await fetchEthPrice();
    
        if (ratio === null) {
            return 0;
        }

        return ratio * etherAmount;
    }

    const fetchEthPrice = async () => {
        try {
            // Fetch ETH price in USD from CoinGecko API
            const response = await fetch(
                "/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
            );
            console.log(await response.body);
            const data = await response.json();
            return data.ethereum.usd; // Return the USD price of Ether
        } catch (error) {
            console.error("Error fetching ETH price:", error);
            return null;
        }
    };

    const getWalletBalance = async () => {
        const balanceInWei = await provider.getBalance(account);
        const balanceInEther = Number(ethers.formatEther(balanceInWei));
        setBalanceInEther(balanceInEther);
        setBalanceInUSD(await etherToUSD(balanceInEther));
    }

    const hideModal = (id) => {
        document.querySelector(`#${id}`).click();
    }

    const stakeTokens = async (amount) => {
        if (contract) {
            try {
                if (amount <= 0)
                {
                    alert("The amount must be positive.");
                    return;
                }
                const tx = await contract.stake({
                    value: ethers.parseEther(amount),
                });
                await tx.wait();
                // await refreshValues();
                hideModal("closeStakeModal");
                alert(`Success, staked ${amount} ETH.`);
            }
            catch (error)
            {
                console.error(error);
                alert(error.reason);
            }
        }
        else 
            console.error("Contract not defined.");
        setToStakeAmount(0);
    };

    const unstakeTokens = async (amount) => {
        if (contract) {
            try {
                if (amount <= 0)
                {
                    alert("The amount must be positive.");
                    return;
                }
                const tx = await contract.unstake(ethers.parseEther(amount));
                await tx.wait();
                // await refreshValues();
                hideModal("closeUnstakeModal");
                alert(`Success, unstaked ${amount} ETH.`);
            }
            catch (error)
            {
                console.error(error);
                alert(error.reason);
            }
        }
        else 
            console.error("Contract not defined.");
        setToStakeAmount(0);
    };
    
    const claimRewards = async () => {
        try {
            const tx = await contract.claimRewards();
            await tx.wait();
            // await refreshValues();
            alert(`Success, rewards claimed.`);
        }
        catch (error)
        {
            console.error(error);
            alert(error.reason);
        }
    }

    if (!account)
    {
        return (
            <div className="w-100 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                You must be connected to see this page.
            </div>
        );
    }
    else {
        return (
            <div className="flex-grow-1 my-5 d-flex flex-column">
                <div className="d-flex align-items-end  ">
                    <h1 className="mt-5 ms-5 m3-3">Dashboard</h1>
                    <a className="link-opacity-25-hover link-secondary fs-3 ms-3 mb-2" role="button" onClick={() => {refreshValues()}}><i className="bi bi-arrow-clockwise"></i></a>
                </div>
                <div className="d-flex justify-content-evenly flex-grow-1 mb-5">
                    <div className="w-50 m-4 h-100 d-flex flex-column">
                        
                        <div className="px-5 py-3 bg-dark rounded shadow mb-4 h-30 d-flex align-items-center">
                            <div className="fs-2 m-0">Balance: 
                                <span className="text-success ms-2">
                                    {formatter.format(balanceInEther.toFixed(4))}
                                </span>
                                <span className="fs-4 text-secondary ms-2">
                                    ETH
                                </span> 

                                <p className="fs-6 m-0 text-secondary ps-3">{formatter.format(balanceInUSD.toFixed(2))} USD</p>
                            </div>
                        </div>

                        <div className="px-5 py-3 bg-dark rounded shadow d-flex h-30 align-items-center justify-content-between">
                            <div className="fs-2 m-0 me-5">Staked: 
                                <span className="text-success ms-2">
                                    {formatter.format(stakerInfo.amountStaked.toFixed(4))}
                                </span>
                                <span className="fs-4 text-secondary ms-2">
                                    ETH
                                </span> 

                            <p className="fs-6 m-0 text-secondary ps-3">{formatter.format(stakedUSD.toFixed(2))} USD</p>
                            </div>
                            <div className="d-flex mt-3">
                                <button className={`btn btn-${stakeCooldown ? "warning disabled" : "success"} mx-2`} data-bs-toggle="modal" data-bs-target="#stakeModal">Stake {stakeCooldown && <i className="bi bi-stopwatch"></i>}</button>
                                <button className={`btn btn-${stakeCooldown ? "warning disabled" : "secondary"} mx-2`} data-bs-toggle="modal" data-bs-target="#unstakeModal">Unstake {stakeCooldown && <i className="bi bi-stopwatch"></i>}</button>
                            </div>
                        </div>

                    </div>
                    <div className="w-50 m-4 rounded h-100 d-flex flex-column">
                        <div className="h-30 px-5 py-3 d-flex bg-dark rounded shadow mb-4 align-items-center justify-content-between">
                            <p className="fs-2 m-0">Rewards:
                                <span className="text-success ms-2">
                                    {formatter.format(stakerInfo.rewards.toFixed(4))}
                                </span>
                                <span className="fs-4 text-secondary ms-2">
                                    RTK
                                </span>
                            </p> 
                        
                            <button className="btn btn-success mx-2 my-3" onClick={() => {claimRewards();}}>Claim rewards</button>
                        </div>
                        <div className="h-30 px-5 py-4 d-flex flex-column bg-dark rounded shadow">
                            <p className="fs-5 m-0 mb-2">Pool share:
                                <span className="fs-6 text-secondary ms-2">
                                    <span className="text-success me-1">
                                        {stakerInfo.totalAmountStaked == 0 ? ("0.00") : 
                                        (
                                            (stakerInfo.amountStaked / stakerInfo.totalAmountStaked * 100).toFixed(2)
                                        )}
                                    </span>
                                    %
                                </span>
                            </p>
                            <p className="fs-5 m-0 mb-3">Total ETH staked:
                                <span className="fs-6 text-secondary ms-2">
                                    <span className="text-success">{formatter.format(stakerInfo.totalAmountStaked.toFixed(2))} </span>
                                    / 1000
                                </span>
                            </p>
                            <div className="progress-stacked bg-secondary">
                            <div className="progress " role="progressbar" aria-label="User ETH" aria-valuenow={userShare} aria-valuemin="0" aria-valuemax="100" style={{width: `${userShare}%`}}>
                                <div className="progress-bar bg-success progress-bar-striped progress-bar-animated"></div>
                            </div>
                            <div className="progress" role="progressbar" aria-label="Total ETH" aria-valuenow={totalShare} aria-valuemin="0" aria-valuemax="100" style={{width: `${totalShare}%`}}>
                                <div className="progress-bar bg-primary progress-bar-striped progress-bar-animated" ></div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" data-bs-theme="dark" id="stakeModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark">
                    <div className="modal-header">
                        <button id="closeStakeModal" type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body d-flex flex-column justify-content-center">
                        <h1 className="modal-title fs-2 text-center text-secondary" id="exampleModalLabel">Stake</h1>
                        <div className="modal-field mt-4">
                            <input className="modal-input" type="number" placeholder="Enter amount" 
                                value={toStakeAmount != 0 ? (toStakeAmount) : ("")}
                                onChange={handleToStake}/>
                            <div className="modal-line"></div>
                        </div>

                    </div>
                    <div className="modal-footer d-flex justify-content-center">
                        <button type="button" className="btn btn-primary" onClick={() => {stakeTokens(toStakeAmount)}}>Stake</button>
                    </div>
                    </div>
                </div>
                </div>

                <div className="modal fade" data-bs-theme="dark" id="unstakeModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content bg-dark">
                    <div className="modal-header">
                        <button id="closeUnstakeModal" type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body d-flex flex-column justify-content-center">
                        <h1 className="modal-title fs-2 text-center text-secondary" id="exampleModalLabel">Unstake</h1>
                        <div className="modal-field mt-4">
                            <input className="modal-input" type="number" placeholder="Enter amount" 
                                value={toStakeAmount != 0 ? (toStakeAmount) : ("")}
                                onChange={handleToStake}/>
                            <div className="modal-line"></div>
                        </div>

                    </div>
                    <div className="modal-footer d-flex justify-content-center">
                        <button type="button" className="btn btn-primary" onClick={() => {unstakeTokens(toStakeAmount)}}>Untake</button>
                    </div>
                    </div>
                </div>
                </div>
            </div>
        );

    }
}

export default Dashboard;
