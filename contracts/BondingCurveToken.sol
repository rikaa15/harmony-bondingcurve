// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {FixedPointMathLib} from "solady/src/utils/FixedPointMathLib.sol";

contract BondingCurveToken is ERC20 {
    using FixedPointMathLib for uint256;
    using FixedPointMathLib for int256;

    uint256 public immutable A;
    uint256 public immutable B;
    uint256 public reserveTokenBalance;

    event TokensPurchased(address indexed buyer, uint256 amountSpent, uint256 tokensMinted);
    event TokensSold(address indexed seller, uint256 tokensSold, uint256 etherReturned);

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialA,
        uint256 initialB
    ) ERC20(name, symbol) {
        A = initialA;
        B = initialB;
        reserveTokenBalance = 0;
    }

    // Calculate the funds received for selling deltaX tokens
    function getFundsReceived(
        uint256 x0,
        uint256 deltaX
    ) public view returns (uint256 deltaY) {
        uint256 a = A;
        uint256 b = B;
        require(x0 >= deltaX, "Selling more tokens than available supply");

        int256 exp_b_x0 = (int256(b.mulWad(x0))).expWad();
        int256 exp_b_x1 = (int256(b.mulWad(x0 - deltaX))).expWad();

        uint256 delta = uint256(exp_b_x0 - exp_b_x1);
        deltaY = a.fullMulDiv(delta, b);
    }

    // Calculate the number of tokens that can be purchased for a given amount of funds
    function getAmountOut(
        uint256 x0,
        uint256 deltaY
    ) public view returns (uint256 deltaX) {
        uint256 a = A;
        uint256 b = B;

        uint256 exp_b_x0 = uint256((int256(b.mulWad(x0))).expWad());

        uint256 exp_b_x1 = exp_b_x0 + deltaY.fullMulDiv(b, a);

        deltaX = uint256(int256(exp_b_x1).lnWad()).divWad(b) - x0;
    }

    // Buy tokens using ONE
    function buy() external payable {
        require(msg.value > 0, "Must send ETH to buy tokens");

        uint256 currentSupply = totalSupply();
        uint256 tokensToMint = getAmountOut(currentSupply, msg.value);

        reserveTokenBalance += msg.value;
        _mint(msg.sender, tokensToMint);

        emit TokensPurchased(msg.sender, msg.value, tokensToMint);
    }

    // Sell tokens for ONE
    function sell(uint256 amount) external {
        require(amount > 0, "Must sell more than 0 tokens");
        require(balanceOf(msg.sender) >= amount, "Insufficient token balance");

        uint256 currentSupply = totalSupply();
        uint256 etherToReturn = getFundsReceived(currentSupply, amount);

        require(etherToReturn <= reserveTokenBalance, "Not enough reserves to sell tokens");

        reserveTokenBalance -= etherToReturn;
        _burn(msg.sender, amount);
        
        (bool success, ) = msg.sender.call{value: etherToReturn}("");
        require(success, "Transfer failed.");

        emit TokensSold(msg.sender, amount, etherToReturn);
    }

}
