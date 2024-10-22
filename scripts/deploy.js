const hre = require("hardhat");

async function main() {
    const BondingCurveToken = await hre.ethers.getContractFactory("BondingCurveToken");

    const initialReservePrice = ethers.utils.parseEther("0.01");
    const scalingFactor = 1000;

    const token = await BondingCurveToken.deploy("HarmonyBondingCurveToken", "HBCURVE", initialReservePrice, scalingFactor);

    await token.deployed();

    console.log("BondingCurveToken deployed to:", token.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
