// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "./DAPPToken.sol";
import "hardhat/console.sol";

contract Crowdsale {
    address payable public owner;
    DAPPToken public dappToken;
    uint256 public price;
    uint256 public maxTokens;
    uint256 public tokensSold;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public minPurchase;
    uint256 public maxPurchase;
    address[] public requestors;
    bool refundStatus;

    enum WhitelistStatus {
        Pending,
        Approved,
        Rejected,
        None
    }

    mapping(address => bool) public isWhitelisted;
    mapping(address => WhitelistStatus) public whitelistStatus;
    mapping(address => uint256) public purchaseAmount;
    mapping(address => bool) public isPendingWhitelist;
    mapping(address => mapping(uint256 => uint256)) public ethTokenBalance;

    event Buy(uint256 amount, address buyer);
    event Finalize(uint256 amount, uint256 value);
    event AddressAdded(address indexed _addr);
    event AddressApproved(address indexed _addr);
    event AddressRejected(address indexed _addr);
    event Refund(address indexed _addr, uint256 amount);

    constructor(
        DAPPToken _dappToken,
        uint256 _price,
        uint256 _maxTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _minPurchase,
        uint256 _maxPurchase
    ) {
        owner = payable(msg.sender);
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
        uint256 requiredEth = (_amount / 1e18) * price;
        require(msg.value == requiredEth, "Invalid amount of Ether");
        require(_amount <= maxPurchase && _amount >= minPurchase);
        require(dappToken.balanceOf(address(this)) >= _amount);

        purchaseAmount[msg.sender] += _amount;

        require(dappToken.transfer(msg.sender, _amount));

        tokensSold += _amount;

        ethTokenBalance[msg.sender][purchaseAmount[msg.sender]] = msg.value;

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
        if (
            whitelistStatus[msg.sender] != WhitelistStatus.Pending &&
            whitelistStatus[msg.sender] != WhitelistStatus.None
        ) {
            revert("You have already requested");
        }

        whitelistStatus[msg.sender] = WhitelistStatus.Pending;
        isPendingWhitelist[msg.sender] = true;
        requestors.push(msg.sender);

        emit AddressAdded(msg.sender);
    }

    function approveWhitelist(address _addr) public onlyOwner {
        require(
            whitelistStatus[_addr] == WhitelistStatus.Pending,
            "Address is not in pending list"
        );
        whitelistStatus[_addr] = WhitelistStatus.Approved;
        isPendingWhitelist[_addr] = false;
        isWhitelisted[_addr] = true;

        emit AddressApproved(_addr);
    }

    function approveWhitelistToAll(
        address[] calldata _addresses
    ) public onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            address _addr = _addresses[i];
            if (whitelistStatus[_addr] == WhitelistStatus.Pending) {
                whitelistStatus[_addr] = WhitelistStatus.Approved;
                isPendingWhitelist[_addr] = false;
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
            if (whitelistStatus[_addr] == WhitelistStatus.Pending) {
                whitelistStatus[_addr] = WhitelistStatus.Rejected;
                isPendingWhitelist[_addr] = false;
                emit AddressRejected(_addr);
            }
        }
    }

    function rejectWhitelist(address _addr) public onlyOwner {
        require(
            whitelistStatus[_addr] == WhitelistStatus.Pending,
            "Address is not in pending list"
        );
        whitelistStatus[_addr] = WhitelistStatus.Rejected;
        isPendingWhitelist[_addr] = false;

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
            status[i] = whitelistStatus[_addresses[i]];
        }
        return status;
    }

    function getPendingStatusAddr() public view returns (address[] memory) {
        address[] memory addresses = new address[](requestorsCount());
        uint256 index = 0;
        for (uint256 i = 0; i < requestors.length; i++) {
            if (isPendingWhitelist[requestors[i]] == true) {
                addresses[index] = requestors[i];
                index++;
            }
        }
        return addresses;
    }

    function requestorsCount() private view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < requestors.length; i++) {
            if (isPendingWhitelist[requestors[i]]) {
                count++;
            }
        }
        return count;
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

        resetWhitelist();
    }

    function resetWhitelist() internal onlyOwner {
        for (uint256 i = 0; i < requestors.length; i++) {
            address requestor = requestors[i];
            isWhitelisted[requestor] = false;
            whitelistStatus[requestor] = WhitelistStatus.None;
            isPendingWhitelist[requestor] = false;
        }
    }

    function setRefundStatus(bool _status) public onlyOwner {
        refundStatus = _status;
    }

    function withdrawBalance() public onlyOwner {
        require(address(this).balance > 0, "Balance is zero");
        (bool success, ) = owner.call{value: address(this).balance}("");
        require(success, "Failed to send Ether");
    }

    function _checkAllowance(address _sender) private view returns (uint256) {
        return dappToken.allowance(_sender, address(this));
    }

    function refundCampaign() public onlyCampaignEnd {
        require(refundStatus == true, "Refund is not enabled");

        uint256 refundAmount = purchaseAmount[msg.sender];

        require(refundAmount > 0, "You have not purchased any tokens");

        purchaseAmount[msg.sender] = 0;
        tokensSold -= refundAmount;

        dappToken.transferFrom(msg.sender, address(this), refundAmount);

        uint256 ethAmount = (refundAmount / 1e18) * price;
        require(address(this).balance >= ethAmount, "Insufficient balance");

        ethTokenBalance[msg.sender][refundAmount] -= ethAmount;

        (bool ethSuccess, ) = msg.sender.call{value: ethAmount}("");
        require(ethSuccess, "Failed to send Ether");

        emit Refund(msg.sender, refundAmount);
    }
}
