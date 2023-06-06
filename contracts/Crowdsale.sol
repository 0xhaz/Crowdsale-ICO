// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./DAPPToken.sol";
import "hardhat/console.sol";

contract Crowdsale {
    address public owner;
    DAPPToken public dappToken;
    uint256 public price;
    uint256 public maxTokens;
    uint256 public tokensSold;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public minPurchase;
    uint256 public maxPurchase;
    bool refundStatus;

    enum WhitelistStatus {
        Pending,
        Approved,
        Rejected
    }

    mapping(address => bool) public isWhitelisted;
    mapping(address => WhitelistStatus) public whiteListStatus;
    mapping(address => uint256) public purchaseAmount;

    event Buy(uint256 amount, address buyer);
    event Finalize(uint256 amount, uint256 value);
    event AddressAdded(address indexed _addr);
    event AddressApproved(address indexed _addr);
    event AddressRejected(address indexed _addr);

    constructor(
        DAPPToken _dappToken,
        uint256 _price,
        uint256 _maxTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _minPurchase,
        uint256 _maxPurchase
    ) {
        owner = msg.sender;
        dappToken = _dappToken;
        price = _price;
        maxTokens = _maxTokens;
        startTime = _startTime;
        endTime = _endTime;
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyWhiteListed() {
        require(isWhitelisted[msg.sender], "Address not whitelisted");
        _;
    }

    modifier onlyWhileOpen() {
        require(block.timestamp >= startTime, "Sale is not started yet");
        require(block.timestamp <= endTime, "Sale already ended");
        _;
    }

    modifier onlyCampaignEnd() {
        require(block.timestamp > endTime, "Sale is not ended yet");
        _;
    }

    receive() external payable onlyWhileOpen onlyWhiteListed {
        uint256 amount = msg.value / price;
        buyTokens(amount * 1e18);
    }

    function buyTokens(
        uint256 _amount
    ) public payable onlyWhiteListed onlyWhileOpen {
        require(msg.value == (_amount / 1e18) * price);
        require(_amount <= maxPurchase && _amount >= minPurchase);
        require(dappToken.balanceOf(address(this)) >= _amount);

        purchaseAmount[msg.sender] += _amount;
        require(dappToken.transfer(msg.sender, _amount));

        tokensSold += _amount;

        emit Buy(_amount, msg.sender);
    }

    function finalize() public onlyOwner {
        require(dappToken.transfer(owner, dappToken.balanceOf(address(this))));

        uint256 value = address(this).balance;
        (bool success, ) = owner.call{value: value}("");
        require(success, "Failed to send Ether");

        emit Finalize(tokensSold, value);
    }

    function setContribution(
        uint256 _minPurchase,
        uint256 _maxPurchase
    ) public onlyOwner {
        minPurchase = _minPurchase;
        maxPurchase = _maxPurchase;
    }

    function setPrice(uint256 _price) public onlyOwner {
        price = _price;
    }

    function requestWhitelist() public {
        require(
            whiteListStatus[msg.sender] == WhitelistStatus.Pending,
            "You have already requested"
        );
        whiteListStatus[msg.sender] = WhitelistStatus.Pending;

        emit AddressAdded(msg.sender);
    }

    function approveWhitelist(address _addr) public onlyOwner {
        require(
            whiteListStatus[_addr] == WhitelistStatus.Pending,
            "Address is not in pending list"
        );
        whiteListStatus[_addr] = WhitelistStatus.Approved;
        isWhitelisted[_addr] = true;

        emit AddressApproved(_addr);
    }

    function approveWhitelistToAll(
        address[] calldata _addresses
    ) public onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            address _addr = _addresses[i];
            if (whiteListStatus[_addr] == WhitelistStatus.Pending) {
                whiteListStatus[_addr] = WhitelistStatus.Approved;
                isWhitelisted[_addr] = true;
                emit AddressApproved(_addr);
            }
        }
    }

    function rejectWhitelistToAll(
        address[] calldata _addresses
    ) public onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            address _addr = _addresses[i];
            if (whiteListStatus[_addr] == WhitelistStatus.Pending) {
                whiteListStatus[_addr] = WhitelistStatus.Rejected;
                emit AddressRejected(_addr);
            }
        }
    }

    function rejectWhitelist(address _addr) public onlyOwner {
        require(
            whiteListStatus[_addr] == WhitelistStatus.Pending,
            "Address is not in pending list"
        );
        whiteListStatus[_addr] = WhitelistStatus.Rejected;

        emit AddressRejected(_addr);
    }

    function getWhitelistStatus(address _addr) public view returns (bool) {
        return isWhitelisted[_addr];
    }

    function getWhitelistStatusAll(
        address[] calldata _addresses
    ) public view returns (WhitelistStatus[] memory) {
        WhitelistStatus[] memory status = new WhitelistStatus[](
            _addresses.length
        );
        for (uint256 i = 0; i < _addresses.length; i++) {
            status[i] = whiteListStatus[_addresses[i]];
        }
        return status;
    }

    function whitelistAddress(address _addr) public onlyOwner {
        isWhitelisted[_addr] = true;
    }

    function enableRefund() public onlyOwner onlyCampaignEnd {
        refundStatus = true;
    }

    function disableRefund() public onlyOwner {
        refundStatus = false;
    }

    function removeAddressFromWhiteList(address _addr) public onlyOwner {
        isWhitelisted[_addr] = false;
    }

    function restartCampaign(
        uint256 _startTime,
        uint256 _endTime
    ) public onlyOwner {
        startTime = _startTime;
        endTime = _endTime;
        refundStatus = false;
    }

    function refundCampaign() public onlyCampaignEnd {
        require(refundStatus == true, "Refund is not enabled");

        uint256 refundAmount = purchaseAmount[msg.sender];

        require(refundAmount > 0, "You have not purchased any tokens");
        purchaseAmount[msg.sender] = 0;
        tokensSold -= refundAmount / price;

        require(
            dappToken.transferFrom(msg.sender, address(this), refundAmount)
        );
        payable(msg.sender).transfer(refundAmount);
    }
}
