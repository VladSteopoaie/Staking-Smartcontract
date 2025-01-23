import React, { useEffect, useState } from "react";
import useContract from "../hooks/useContract";
import Stake from "./Stake";
const { ethers } = require("ethers");

function Dashboard({ account }) {
    const { contract } = useContract();
    const [provider, setProvider] = useState();
    const [balanceInEther, setBalanceInEther] = useState(null);
    const [balanceInUSD, setBalanceInUSD] = useState(null);
    const [stakedUSD, setStakedUSD] = useState(0);
    const [stakerInfo, setStakerInfo] = useState({
        amountStaked: 0,
        rewards: 0,
        lastStaked: 0,
        lastClaimedRewards: 0,
        totalAmountStaked: 0,
    });
    const [userShare, setUserShare] = useState();
    const [totalShare, setTotalShare] = useState();
    const [toStakeAmount, setToStakeAmount] = useState(0);

    const handleToStake = (event) => {
        setToStakeAmount(event.target.value);
    }

    useEffect(() => {
        if (account) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            setProvider(provider);
        }
    }, [account]);

    useEffect(() => {
        if (provider && contract) {
            refreshValues();
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
                    lastClaimedRewards,
                    totalAmountStaked,
                ] = await contract.viewInfo();

                // Update state with the fetched data
                setStakerInfo({
                    amountStaked: Number(ethers.formatEther(amountStaked)), // Convert from Wei
                    rewards: Number(ethers.formatEther(rewards)),
                    lastStaked: new Date(Number(lastStaked)  * 1000).toLocaleString(), // Convert timestamp to readable date
                    lastClaimedRewards: new Date(Number(lastClaimedRewards) * 1000).toLocaleString(),
                    totalAmountStaked: Number(ethers.formatEther(totalAmountStaked)),
                });
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

    const stakeTokens = async (amount) => {
        if (contract) {
            try {
                const tx = await contract.stake({
                    value: ethers.parseEther(amount),
                    nonce: 0
                });
                await tx.wait();
                // alert("Staked 1 token!");
                await refreshValues();
            }
            catch (error)
            {
                console.error(error);
            }
        }
        else 
            console.error("Contract not defined.");
    };

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
                                    {balanceInEther && (`${balanceInEther.toFixed(4)}`)}
                                </span>
                                <span className="fs-4 text-secondary ms-2">
                                    ETH
                                </span> 

                                <p className="fs-6 m-0 text-secondary ps-3">{balanceInUSD && (`${balanceInUSD.toFixed(2)} USD`)}</p>
                            </div>
                        </div>

                        <div className="px-5 py-3 bg-dark rounded shadow d-flex h-30 align-items-center justify-content-between">
                            <div className="fs-2 m-0 me-5">Staked: 
                                <span className="text-success ms-2">
                                    {stakerInfo.amountStaked.toFixed(4)}
                                </span>
                                <span className="fs-4 text-secondary ms-2">
                                    ETH
                                </span> 

                            <p className="fs-6 m-0 text-secondary ps-3">{stakedUSD.toFixed(2)} USD</p>
                            </div>
                            <div className="d-flex mt-3">
                                <button className="btn btn-success mx-2" data-bs-toggle="modal" data-bs-target="#stakeModal">Stake</button>
                                {/* <Stake account={account} amount={"1"}/> */}
                                <button className="btn btn-secondary mx-2">Unstake</button>
                            </div>
                        </div>

                    </div>
                    <div className="w-50 m-4 rounded h-100 d-flex flex-column">
                        <div className="h-30 px-5 py-3 d-flex bg-dark rounded shadow mb-4 align-items-center justify-content-between">
                            <p className="fs-2 m-0">Rewards:
                                <span className="text-success ms-2">
                                    {stakerInfo.rewards.toFixed(4)}
                                </span>
                                <span className="fs-4 text-secondary ms-2">
                                    RTK
                                </span>
                            </p> 
                        
                            <button className="btn btn-success mx-2 my-3">Claim rewards</button>
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
                                    <span className="text-success">{stakerInfo.totalAmountStaked.toFixed(2) } </span>
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
                        <button type="button" className="btn-close " data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body d-flex flex-column justify-content-center">
                        <h1 className="modal-title fs-2 text-center text-secondary" id="exampleModalLabel">Stake</h1>
                        <div className="modal-field mt-4">
                            <input className="modal-input" type="number" placeholder="Enter amount" 
                                value={toStakeAmount}
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
            </div>
        );

    }
}

export default Dashboard;
