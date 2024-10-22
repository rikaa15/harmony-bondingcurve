import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import BondingCurveTokenABI from './abi/BondingCurveToken.json';
import { TextField, Button, Typography, Box } from '@mui/material';

const contractAddress = "0x760fD576868506c8413669A21F684adACb789a74"; // Contract Address

const TokenInterface = () => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [tokenContract, setTokenContract] = useState(null);
    const [userAddress, setUserAddress] = useState(null);
    const [balance, setBalance] = useState(0);
    const [buyAmount, setBuyAmount] = useState(""); 
    const [sellAmount, setSellAmount] = useState("");
    const [estimatedBuyTokens, setEstimatedBuyTokens] = useState(0);
    const [estimatedReturn, setEstimatedReturn] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [sellError, setSellError] = useState("");
    const [estimatedTokenPrice, setEstimatedTokenPrice] = useState(1);

    useEffect(() => {
        const init = async () => {
            if (window.ethereum) {
                const newProvider = new ethers.BrowserProvider(window.ethereum);
                setProvider(newProvider);

                const newSigner = await newProvider.getSigner();
                setSigner(newSigner);

                const address = await newSigner.getAddress();
                setUserAddress(address);

                const contract = new ethers.Contract(contractAddress, BondingCurveTokenABI.abi, newSigner);
                setTokenContract(contract);
                console.log("Token contract initialized:", contract);

                const balance = await contract.balanceOf(address);
                setBalance(ethers.formatUnits(balance, 18));

                const supply = await contract.totalSupply();
                setTotalSupply(ethers.formatUnits(supply, 18));

                const intervalId = setInterval(async () => {
                    const updatedSupply = await contract.totalSupply();
                    setTotalSupply(ethers.formatUnits(updatedSupply, 18));
                    
                }, 10000);
                return () => clearInterval(intervalId);
            } else {
                console.error("Please install MetaMask!");
            }
        };

        init();
    }, []);

    useEffect(() => {
        const fetchEstimatedTokenPrice = async () => {
            if (tokenContract) {
                await getEstimatedTokenPrice();
            }
        };
        fetchEstimatedTokenPrice();
    }, [tokenContract]);
    
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (tokenContract) {
                getEstimatedTokenPrice();
            }
        }, 10000);

        return () => clearInterval(intervalId);
    }, [tokenContract]);

    const getEstimatedTokenPrice = async () => {
        if (tokenContract) {
            try {
                const currentSupply = await tokenContract.totalSupply();

                const currentSupplyNum = parseFloat(ethers.formatUnits(currentSupply, 18)); 

                if (currentSupplyNum > 0) {
                    const estimatedTokens = await tokenContract.getAmountOut(currentSupply, ethers.parseUnits("1", 18));
                    setEstimatedTokenPrice(parseFloat(ethers.formatUnits(estimatedTokens, 18)));
                } else {
                    console.warn("Current supply is zero, unable to estimate token price.");
                    setEstimatedTokenPrice(0);
                }
            } catch (error) {
                console.error("Error fetching estimated tokens:", error);
                setEstimatedTokenPrice(0);
            }
        } else {
            console.warn("Token contract is not initialized yet.");
        }
    };
    
    

    const refreshBalance = async () => {
        if (tokenContract && userAddress) {
            const balance = await tokenContract.balanceOf(userAddress);
            setBalance(ethers.formatUnits(balance, 18));
        }
    };

    const getEstimatedTokens = async (amount) => {
        if (tokenContract && amount) {
            try {
                const currentSupply = await tokenContract.totalSupply();
                const estimatedTokens = await tokenContract.getAmountOut(currentSupply, ethers.parseEther(amount));
                setEstimatedBuyTokens(ethers.formatUnits(estimatedTokens, 18));
                return estimatedTokens;
            } catch (error) {
                console.error("Error fetching estimated tokens:", error);
                setEstimatedBuyTokens(0);
            }
        }
        return 0;
    };
    

    const buyTokens = async () => {
        if (tokenContract && buyAmount) {
            const valueToSend = ethers.parseEther(buyAmount);
            try {
                const tx = await tokenContract.buy({ value: valueToSend });
                await tx.wait();
                refreshBalance();
                setBuyAmount("");
                setEstimatedBuyTokens(0);
            } catch (error) {
                console.error("Error buying tokens:", error);
                alert("Error buying tokens. Check console for details.");
            }
        }
    };

    const getEstimatedReturn = async (amount) => {
        if (tokenContract && amount) {
            try {
                const userBalance = parseFloat(balance);
                const amountToSell = parseFloat(amount);

                if (amountToSell > userBalance) {
                    setSellError("You cannot sell more tokens than your balance.");
                    setEstimatedReturn(0);
                    return;
                }

                const currentSupply = await tokenContract.totalSupply();
                const returnAmount = await tokenContract.getFundsReceived(currentSupply, ethers.parseUnits(amount, 18));
                setEstimatedReturn(ethers.formatUnits(returnAmount, 18));
                setSellError("");
            } catch (error) {
                console.error("Error fetching estimated return:", error);
                setEstimatedReturn(0);
            }
        }
    };

    const sellTokens = async () => {
        setSellError("");
        if (tokenContract && sellAmount) {
            const amountToSell = ethers.parseUnits(sellAmount, 18);
            const userBalance = parseFloat(balance);
            
            if (parseFloat(sellAmount) > userBalance) {
                setSellError("You cannot sell more tokens than your balance.");
                return;
            }
            
            try {
                const tx = await tokenContract.sell(amountToSell);
                await tx.wait();
                refreshBalance();
                setSellAmount("");
                setEstimatedReturn(0);
            } catch (error) {
                console.error("Error selling tokens:", error);
                setSellError("Error selling tokens. Check console for details.");
            }
        }
    };

    return (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h4">Bonding Curve Token Interface</Typography>
            {userAddress && <Typography>Your Address: {userAddress}</Typography>}
            {balance && <Typography>Your Token Balance: {balance}</Typography>}
            {totalSupply && <Typography>Total Token Supply: {totalSupply}</Typography>}
            <Typography>1 HB CURVE: {parseFloat(1 / estimatedTokenPrice)} ONE</Typography>

            <Box sx={{ marginTop: 2 }}>
                <Typography variant="h6">Buy Tokens</Typography>
                <TextField
                    label="Amount in ONE"
                    type="text"
                    value={buyAmount}
                    onChange={(e) => {
                        setBuyAmount(e.target.value);
                        getEstimatedTokens(e.target.value);
                    }}
                    variant="outlined"
                    sx={{ marginRight: 1 }}
                />
                <Button variant="contained" color="primary" onClick={buyTokens}>Buy Tokens</Button>
                <Typography variant="body1" sx={{ marginTop: 2 }}>
                    Estimated Tokens: {estimatedBuyTokens} HB CURVE
                </Typography>
            </Box>

            <Box sx={{ marginTop: 2 }}>
                <Typography variant="h6">Sell Tokens</Typography>
                <TextField
                    label="Amount of Tokens"
                    type="text"
                    value={sellAmount}
                    onChange={(e) => {
                        setSellAmount(e.target.value);
                        getEstimatedReturn(e.target.value);
                    }}
                    variant="outlined"
                    sx={{ marginRight: 1 }}
                />
                <Button variant="contained" color="secondary" onClick={sellTokens}>Sell Tokens</Button>
                {sellError && (
                    <Typography variant="body1" sx={{ color: 'red', marginTop: 2 }}>
                        {sellError}
                    </Typography>
                )}
                <Typography variant="body1" sx={{ marginTop: 2 }}>
                    Estimated Return: {estimatedReturn} ONE
                </Typography>
            </Box>
        </Box>
    );
};

export default TokenInterface;
