const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = n => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

const dateToUnix = date => {
  return Math.floor(new Date(date).getTime() / 1000).toString();
};

const WhitelistStatus = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
};

describe("Crowdsale", () => {
  let crowdsale, token, accounts, deployer, user1, user2;
  let startTime = dateToUnix(new Date(Date.now()));
  let endTime = dateToUnix(new Date(Date.now() + 86400000) * 2);

  beforeEach(async () => {
    const Crowdsale = await ethers.getContractFactory("Crowdsale");
    const Token = await ethers.getContractFactory("DAPPToken");

    token = await Token.deploy("1000000");

    crowdsale = await Crowdsale.deploy(
      token.address,
      ether(1),
      "1000000",
      startTime,
      endTime,
      tokens(100),
      tokens(10000)
    );

    [deployer, user1, user2, _] = await ethers.getSigners();

    let transaction = await token
      .connect(deployer)
      .transfer(crowdsale.address, tokens(1000000));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("sends token to the Crowdsale contract", async () => {
      expect(await token.balanceOf(crowdsale.address)).to.equal(
        tokens(1000000)
      );
    });

    it("sets the token price", async () => {
      expect(await crowdsale.price()).to.equal(ether(1));
    });

    it("sets the token address", async () => {
      expect(await crowdsale.dappToken()).to.equal(token.address);
    });

    it("sets the start time", async () => {
      expect(await crowdsale.startTime()).to.equal(startTime);
    });

    it("sets the end time", async () => {
      expect(await crowdsale.endTime()).to.equal(endTime);
    });

    it("sets the minimum purchase", async () => {
      expect(await crowdsale.minPurchase()).to.equal(tokens(100));
    });

    it("sets the maximum purchase", async () => {
      expect(await crowdsale.maxPurchase()).to.equal(tokens(10000));
    });
  });

  describe("Buying Tokens", () => {
    let transaction, result;
    let minAmount = tokens(100);
    let maxAmount = tokens(10000);
    let amount = tokens(10);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale
          .connect(deployer)
          .whitelistAddress(user1.address);
        result = await transaction.wait();

        transaction = await crowdsale.connect(user1).buyTokens(minAmount, {
          value: ether(100),
        });
        result = await transaction.wait();
      });

      it("should whitelist user address", async () => {
        expect(await crowdsale.getWhitelistStatus(user1.address)).to.equal(
          true
        );
      });

      it("allows user to buy tokens", async () => {
        expect(await token.balanceOf(user1.address)).to.equal(minAmount);
        expect(await token.balanceOf(crowdsale.address)).to.equal(
          tokens(999900)
        );
      });

      it("updates contracts ether balance", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(
          ether(100)
        );
      });

      it("emits a BuyTokens event", async () => {
        await expect(transaction)
          .to.emit(crowdsale, "Buy")
          .withArgs(minAmount, user1.address);
      });
    });

    describe("Failure", () => {
      it("rejects purchases that exceed the max purchase amount", async () => {
        await crowdsale.connect(deployer).whitelistAddress(user1.address);
        await expect(
          crowdsale.connect(user1).buyTokens(maxAmount + 1, {
            value: ether(100),
          })
        ).to.be.reverted;
      });

      it("rejects purchases that are less than the min purchase amount", async () => {
        await crowdsale.connect(deployer).whitelistAddress(user1.address);
        await expect(
          crowdsale.connect(user1).buyTokens(amount, {
            value: ether(100),
          })
        ).to.be.reverted;
      });

      it("rejects purchases from non-whitelisted addresses", async () => {
        await expect(
          crowdsale.connect(user1).buyTokens(minAmount, {
            value: ether(100),
          })
        ).to.be.revertedWith("Address not whitelisted");
      });

      it("rejects purchases after the end time", async () => {
        const endTime = Math.floor(Date.now() / 1000) - 1; // Set the end time to a past timestamp
        await crowdsale.restartCampaign(startTime, endTime); // Update the contract's end time

        await crowdsale.connect(deployer).whitelistAddress(user1.address);

        await expect(
          crowdsale.connect(user1).buyTokens(minAmount, {
            value: ether(100),
          })
        ).to.be.revertedWith("Sale already ended");
      });
    });
  });

  describe("Sending ETH", () => {
    let transaction, result;
    let minAmount = tokens(100);
    let maxAmount = tokens(10000);
    let amount = tokens(10);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale
          .connect(deployer)
          .whitelistAddress(user1.address);
        result = await transaction.wait();

        transaction = await user1.sendTransaction({
          to: crowdsale.address,
          value: ether(100),
        });
        result = await transaction.wait();
      });

      it("should whitelist user address", async () => {
        expect(await crowdsale.getWhitelistStatus(user1.address)).to.equal(
          true
        );
      });

      it("allows user to send ETH to the contract", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(
          ether(100)
        );
      });

      it("updates user token balance", async () => {
        expect(await token.balanceOf(user1.address)).to.equal(minAmount);
      });
    });
  });

  describe("Updating Campaign", () => {
    let transaction, result;
    let minAmount = tokens(100);
    let maxAmount = tokens(10000);
    let amount = tokens(10);
    let price = ether(2);
    let startTime = Math.floor(Date.now() / 1000);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale.connect(deployer).setPrice(price);
        result = await transaction.wait();

        transaction = await crowdsale
          .connect(deployer)
          .setContribution(tokens(10), tokens(100));
        result = await transaction.wait();

        transaction = await crowdsale
          .connect(deployer)
          .restartCampaign(startTime, endTime);
        result = await transaction.wait();
      });

      it("update price", async () => {
        expect(await crowdsale.price()).to.equal(price);
      });

      it("update minimum & maximum contributions", async () => {
        expect(await crowdsale.minPurchase()).to.equal(tokens(10));
        expect(await crowdsale.maxPurchase()).to.equal(tokens(100));
      });

      it("update campaign with new start and end date", async () => {
        expect(await crowdsale.startTime()).to.equal(startTime);
        expect(await crowdsale.endTime()).to.equal(endTime);
      });
    });
  });

  describe("Finalizing Sale", () => {
    let transaction, result;
    let minAmount = tokens(100);
    let value = ether(100);

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale
          .connect(deployer)
          .whitelistAddress(user1.address);
        result = await transaction.wait();

        transaction = await crowdsale
          .connect(user1)
          .buyTokens(minAmount, { value: value });
        result = await transaction.wait();

        transaction = await crowdsale.connect(deployer).finalize();
        result = await transaction.wait();
      });

      it("transfers remaining tokens to owner", async () => {
        expect(await token.balanceOf(crowdsale.address)).to.equal(0);
        expect(await token.balanceOf(deployer.address)).to.equal(
          tokens(999900)
        );
      });

      it("transfers ETH balance to owner", async () => {
        expect(await ethers.provider.getBalance(crowdsale.address)).to.equal(0);
      });

      it("emits Finalized event", async () => {
        await expect(transaction)
          .to.emit(crowdsale, "Finalize")
          .withArgs(minAmount, value);
      });
    });

    describe("Failure", () => {
      it("rejects if not owner", async () => {
        await expect(crowdsale.connect(user1).finalize()).to.be.revertedWith(
          "Only owner can call this function"
        );
      });
    });
  });

  describe("Whitelisting Addresses", () => {
    let transaction, result;

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await crowdsale.connect(user1).requestWhitelist();
        result = await transaction.wait();

        transaction = await crowdsale.connect(user2).requestWhitelist();
        result = await transaction.wait();
      });

      it("stores all the whitelist request", async () => {
        const pendingAddresses = await crowdsale.getPendingStatusAddr();
        expect(pendingAddresses).to.deep.equal([user1.address, user2.address]);
      });

      it("set the WhiteListStatus to Pending", async () => {
        const addresses = [user1.address, user2.address];
        const whitelistStatus = await crowdsale.getWhitelistStatusAll(
          addresses
        );
        expect(whitelistStatus).to.deep.equal([
          WhitelistStatus.Pending,
          WhitelistStatus.Pending,
        ]);
      });

      it("approve all the whitelist request", async () => {
        const addresses = [user1.address, user2.address];

        transaction = await crowdsale
          .connect(deployer)
          .approveWhitelistToAll(addresses);
        result = await transaction.wait();

        const whitelistStatus = await crowdsale.getWhitelistStatusAll(
          addresses
        );
        expect(whitelistStatus).to.deep.equal([
          WhitelistStatus.Approved,
          WhitelistStatus.Approved,
        ]);
      });

      it("reject all the whitelist request", async () => {
        const addresses = [user1.address, user2.address];

        transaction = await crowdsale
          .connect(deployer)
          .rejectWhitelistToAll(addresses);
        result = await transaction.wait();

        const whitelistStatus = await crowdsale.getWhitelistStatusAll(
          addresses
        );
        expect(whitelistStatus).to.deep.equal([
          WhitelistStatus.Rejected,
          WhitelistStatus.Rejected,
        ]);
      });
    });
  });
});
