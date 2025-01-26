// scripts/fast-forward-time.ts

import { network } from "hardhat";

async function fastForwardTime(seconds: number): Promise<void> {
    console.log(`Fast forwarding time by ${seconds} seconds...`);
    await network.provider.send("evm_increaseTime", [seconds]);
    await network.provider.send("evm_mine", []);
    console.log(`Time advanced by ${seconds} seconds.`);
}

async function main(): Promise<void> {
    const secondsToAdvance = 86400; 

    await fastForwardTime(secondsToAdvance);
    
    console.log(`Blockchain time has been advanced by ${secondsToAdvance} seconds.`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
