# Crowdsale

![Crowdsale Demo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMzYwMjZjNDM2MjEzYWM4YzFkMjAzMWYxYjVjZTIxNGRkMWFmOTEwMiZlcD12MV9pbnRlcm5hbF9naWZzX2dpZklkJmN0PWc/Zf1pBcpxPUdDAjFbbE/giphy.gif)

This project implements a Crowdsale contract that facilitates the sale of tokens in exchange for Ether (ETH). The Crowdsale contract allows users to participate in the token sale by sending Ether to the contract address and receiving tokens in return. The project aims to provide a secure and transparent platform for fundraising through token sales.

## Table of Contents

- [Crowdsale](#crowdsale)
  - [Table of Contents](#table-of-contents)
  - [Contract Overview](#contract-overview)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
  - [Project Walkthrough](#project-walkthrough)
    - [Scenario 1: Campaign Successful](#scenario-1-campaign-successful)
    - [Scenario 2: Campaign Failed](#scenario-2-campaign-failed)
  - [Contract Details](#contract-details)
  - [Contributing](#contributing)
  - [License](#license)

## Contract Overview

The Crowdsale contract is the core component of the project and handles the token sale process. It includes features such as:

- Whitelisting: The contract maintains a whitelist of approved addresses that are allowed to participate in the token sale.
- Purchase Restrictions: Minimum and maximum purchase limits are enforced to ensure fairness and prevent abuse.
- Timed Sale: The token sale is conducted within a specific timeframe, allowing participants to buy tokens only during the specified period.
- Refunds: If enabled by the contract owner, participants can request refunds for their purchased tokens after the token sale ends.
- Finalization: At the end of the token sale, the contract owner can finalize the sale and transfer the remaining tokens and Ether to their respective destinations.

## Getting Started

To use the Crowdsale contract, follow these steps:

1. Clone the repository: `git clone https://github.com/your-username/crowdsale-project.git`
2. Install dependencies: `npm install`
3. Configure the contract parameters, such as token price, maximum tokens, sale start and end time, etc., in the contract constructor.
4. Deploy the contract to the Ethereum network using Hardhat
5. Interact with the contract by sending Ether to the contract address during the token sale period or using other available functions.

## Usage

To participate in the token sale, users should follow the instructions below:

1. Ensure your address is whitelisted by the contract owner. If not, request whitelisting by calling the `requestWhitelist()` function.
2. Send Ether to the contract address. The amount of Ether sent determines the number of tokens purchased.
3. If the token sale is still open and your address is whitelisted, the contract will transfer the corresponding number of tokens to your address.

## Project Walkthrough

### Scenario 1: Campaign Successful

In this scenario, the token sale campaign is successful. Here's a step-by-step walkthrough of the process:

1. The contract owner deploys the Crowdsale contract with the desired parameters, such as token price, maximum tokens, sale start and end time, and purchase restrictions.
2. The contract owner approves whitelisting requests for participating addresses or manually adds addresses to the whitelist.
3. During the token sale period, whitelisted participants send Ether to the contract address.
4. The contract calculates the number of tokens to be allocated based on the Ether sent and the token price.
5. The contract transfers the allocated tokens to the participants' addresses.
6. The tokens sold counter and the participants' token balances are updated accordingly.
7. At the end of the token sale, the contract owner calls the `finalize()` function to complete the sale.
8. The remaining tokens, if any, are transferred back to the contract owner.
9. The contract owner can withdraw the Ether balance from the contract.

### Scenario 2: Campaign Failed

In this scenario, the token sale campaign fails to reach its goals. Here's a step-by-step walkthrough of the process:

1. The contract owner deploys the Crowdsale contract with the desired parameters, such as token price, maximum tokens, sale start and end time, and purchase restrictions.
2. The contract owner approves whitelisting requests for participating addresses or manually adds addresses to the whitelist.
3. During the token sale period, participants send Ether to the contract address.
4. The contract calculates the number of tokens to be allocated based on the Ether sent and the token price.
5. If the token sale ends and the total tokens sold do not reach the minimum required, the contract owner decides to mark the campaign as failed.
6. Participants can request refunds by calling the `refundCampaign()` function.
7. The contract transfers the purchased tokens back to the contract and refunds the corresponding Ether amount to the participants.
8. Participants receive their refunds, and the token balances and tokens sold counter are adjusted accordingly.

## Contract Details

The Crowdsale contract provides several functions for managing the token sale, whitelist, refunds, and other functionalities. Some of the key functions include:

- `buyTokens()`: Allows participants to purchase tokens by sending Ether to the contract address.
- `requestWhitelist()`: Sends a whitelisting request to the contract owner.
- `approveWhitelist()`: Approves a whitelisting request for a specific address.
- `rejectWhitelist()`: Rejects the whitelisting request for a specific address.
- `enableRefund()`: Enables refunds for participants after the token sale ends.
- `disableRefund()`: Disables refunds for participants.
- `withdrawBalance()`: Allows the contract owner to withdraw the contract's balance.
- ... (Other functions for managing whitelisting, address status, and refunding)

## Contributing

Contributions to this project are welcome! If you have any ideas, suggestions, or bug reports, please submit an issue or create a pull request. Remember to adhere to the project's coding conventions and follow the code of conduct.

## License

This project is licensed under the [UNLICENSED](LICENSE) license. Feel free to use, modify, and distribute the code as per your requirements. However, please note that no warranty is provided, and the authors shall not be liable for any damages or liabilities arising from the use of this software.
