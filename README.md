**How to run:**

1. `npm i`
2. Run `npx hardhat run scripts/deploy.js --network harmony` in contracts with your deploy configurations
3. Copy `artifacts/contracts/BondingCurveToken.sol/BondingCurveToken.json` to `bonding-curve-frontend/src/abi`
4. Add deployed contract address to `contractAddress` in `bonding-curve-frontend/src/TokenInterface.js`
5. `npm start` or `npm run build`
