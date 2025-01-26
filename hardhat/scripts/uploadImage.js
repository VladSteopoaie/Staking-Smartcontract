const { create } = require("ipfs-http-client");
const fs = require("fs");
require("dotenv").config();

async function uploadToIPFS() {
    try {
        // Authenticate with Infura
        const client = create({
            host: "ipfs.infura.io",
            port: 5001,
            protocol: "https",
            headers: {
                authorization: "Basic " + Buffer.from(`${process.env.INFURA_PROJECT_ID}:${process.env.INFURA_PROJECT_SECRET}`).toString("base64"),
            },
        });

        // Read the image file
        const imageBuffer = fs.readFileSync("../../rtoken_logo.png");

        // Upload the image to IPFS
        const result = await client.add(imageBuffer);

        console.log("File uploaded to IPFS!");
        console.log("CID:", result.cid.toString());
        console.log("Gateway URL:", `https://ipfs.io/ipfs/${result.cid.toString()}`);
    } catch (error) {
        console.error("Error uploading to IPFS:", error);
    }
}

uploadToIPFS();
