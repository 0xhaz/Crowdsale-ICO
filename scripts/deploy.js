// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function saveContractAddresses(tokenAddress, crowdsaleAddress) {
  const abisDir = path.join(__dirname, "..", "src", "abis");
  const tokenAbiPath = path.join(abisDir, "Token.json");
  const crowdsaleAbiPath = path.join(abisDir, "Crowdsale.json");
  const tokenAddressPath = path.join(abisDir, "TokenAddress.json");
  const crowdsaleAddressPath = path.join(abisDir, "CrowdsaleAddress.json");
  const configPath = path.join(__dirname, "..", "src", "config.json");

  // Create the abis directory if it doesn't exist
  if (!fs.existsSync(abisDir)) {
    fs.mkdirSync(abisDir, { recursive: true });
  }

  // save the token address and abi
  const tokenAbi = await hre.artifacts.readArtifact("DAPPToken");
  fs.writeFileSync(tokenAbiPath, JSON.stringify(tokenAbi, null, 2));

  // save the crowdsale address and abi
  const crowdsaleAbi = await hre.artifacts.readArtifact("Crowdsale");
  fs.writeFileSync(crowdsaleAbiPath, JSON.stringify(crowdsaleAbi, null, 2));

  // save the token address
  fs.writeFileSync(
    tokenAddressPath,
    JSON.stringify({ address: tokenAddress }, null, 2)
  );

  // save the crowdsale address
  fs.writeFileSync(
    crowdsaleAddressPath,
    JSON.stringify({ address: crowdsaleAddress }, null, 2)
  );

  // save the token address and abi config file
  const configData = {
    31337: {
      token: {
        address: tokenAddress,
      },
      crowdsale: {
        address: crowdsaleAddress,
      },
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

  console.log("Contract addresses and ABIs saved successfully!");
}

async function main() {
  const Name = "DAPP Token";
  const Symbol = "DAPP";
  const Max_Supply = "1000000";
  const price = ethers.utils.parseUnits("0.01", "ether");

  const tokens = n => {
    return ethers.utils.parseUnits(n.toString(), "ether");
  };

  const dateToUnix = date => {
    return Math.floor(new Date(date).getTime() / 1000).toString();
  };

  let startTime = dateToUnix(new Date(Date.now()));
  let endTime = dateToUnix(new Date(Date.now() + 86400000) * 2);

  const Crowdsale = await hre.ethers.getContractFactory("Crowdsale");
  const Token = await hre.ethers.getContractFactory("DAPPToken");

  let token = await Token.deploy(Max_Supply);
  await token.deployed();
  console.log("Token deployed to:", token.address);

  let crowdsale = await Crowdsale.deploy(
    token.address,
    price,
    Max_Supply,
    startTime,
    endTime,
    tokens(100),
    tokens(1000)
  );
  await crowdsale.deployed();
  console.log("Crowdsale deployed to:", crowdsale.address);

  let transaction = await token.transfer(
    crowdsale.address,
    ethers.utils.parseUnits(Max_Supply, "ether")
  );
  await transaction.wait();
  console.log("Transfered to Crowdsale");

  await saveContractAddresses(token.address, crowdsale.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
