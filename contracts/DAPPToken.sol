// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DAPPToken is ERC20, Ownable {
    uint256 private maxSupply;
    mapping(address => mapping(address => uint256)) allowed;

    constructor(uint256 _totalSupply) ERC20("DAPP Token", "DAPP") {
        maxSupply = _totalSupply * (10 ** decimals());
        _mint(msg.sender, maxSupply);
    }
}
