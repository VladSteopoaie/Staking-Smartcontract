// scripts/fast-forward-time.ts

import { network } from "hardhat";

async function fastForwardTime(seconds: number): Promise<void> {
    console.log(`Fast forwarding time by ${seconds} seconds...`);
    // Increase the time on the Hardhat network
    await network.provider.send("evm_increaseTime", [seconds]);
    // Mine a new block so that the time increase is applied
    await network.provider.send("evm_mine", []);
    console.log(`Time advanced by ${seconds} seconds.`);
}

async function main(): Promise<void> {
    const secondsToAdvance = 86400 * 2; // For example, 86400 seconds = 1 day

    // Call the fast forward function
    await fastForwardTime(secondsToAdvance);
    
    console.log(`Blockchain time has been advanced by ${secondsToAdvance} seconds.`);
}

// Run the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
