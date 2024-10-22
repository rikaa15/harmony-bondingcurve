require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.27",
    networks: {
        harmony: {
            url: "https://api.harmony.one",
            accounts: [process.env.PRIVATE_KEY],
        },
        harmony_testnet: {
            url: "https://api.s0.b.hmny.io",
            accounts: [process.env.PRIVATE_KEY],
        },
    },
};
