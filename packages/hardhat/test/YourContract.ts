import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("YourContract", function () {
  // We define a fixture to reuse the same setup in every test.

  let yourContract: YourContract;
  before(async () => {
    const [owner] = await ethers.getSigners();
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
    await yourContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should have the right message on deploy", async function () {
      expect(await yourContract.greeting()).to.equal("Building Unstoppable Apps!!!");
    });

    it("Should allow setting a new message", async function () {
      const newGreeting = "Learn Scaffold-ETH 2! :)";

      await yourContract.setGreeting(newGreeting);
      expect(await yourContract.greeting()).to.equal(newGreeting);
    });
  });

  describe("Gas Tracking", function () {
    it("Should record gas usage when setting greeting", async function () {
      const newGreeting = "Test Gas Tracking";

      // Set greeting to trigger gas recording
      await yourContract.setGreeting(newGreeting);

      // Check that gas records were created
      const totalRecords = await yourContract.totalGasRecords();
      expect(totalRecords).to.be.greaterThan(0);
    });

    it("Should return current gas information", async function () {
      const gasInfo = await yourContract.getCurrentGasInfo();

      expect(gasInfo.gasPrice).to.be.greaterThan(0);
      expect(gasInfo.gasLimit).to.be.greaterThan(0);
    });

    it("Should return user gas history", async function () {
      const [owner] = await ethers.getSigners();

      // Set greeting to create gas history
      await yourContract.setGreeting("Gas History Test");

      const userHistory = await yourContract.getUserGasHistory(owner.address);
      expect(userHistory.length).to.be.greaterThan(0);

      // Check the structure of gas info
      const latestRecord = userHistory[userHistory.length - 1];
      expect(latestRecord.gasUsed).to.be.greaterThan(0);
      expect(latestRecord.gasPrice).to.be.greaterThan(0);
      expect(latestRecord.functionName).to.equal("setGreeting");
    });

    it("Should return recent gas history", async function () {
      // Set multiple greetings to create history
      await yourContract.setGreeting("Test 1");
      await yourContract.setGreeting("Test 2");

      const recentHistory = await yourContract.getRecentGasHistory(2);
      expect(recentHistory.length).to.equal(2);

      // Verify the records are in chronological order
      expect(recentHistory[0].timestamp).to.be.lessThanOrEqual(recentHistory[1].timestamp);
    });

    it("Should return gas statistics", async function () {
      // Set greeting to ensure we have data
      await yourContract.setGreeting("Statistics Test");

      const stats = await yourContract.getGasStatistics();
      expect(stats.totalRecords).to.be.greaterThan(0);
      expect(stats.averageGasUsed).to.be.greaterThan(0);
      expect(stats.averageGasPrice).to.be.greaterThan(0);
    });

    it("Should estimate gas for setting greeting", async function () {
      const testGreeting = "Estimate this gas cost";

      const estimation = await yourContract.estimateSetGreetingGas(testGreeting);
      expect(estimation.estimatedGas).to.be.greaterThan(0);
      expect(estimation.estimatedCost).to.be.greaterThan(0);

      // Verify that estimated cost = estimated gas * gas price
      const currentGasInfo = await yourContract.getCurrentGasInfo();
      expect(estimation.estimatedCost).to.equal(estimation.estimatedGas * currentGasInfo.gasPrice);
    });

    it("Should emit GasUsageRecorded event", async function () {
      const newGreeting = "Event Test";

      await expect(yourContract.setGreeting(newGreeting))
        .to.emit(yourContract, "GasUsageRecorded")
        .withArgs(
          (await ethers.getSigners())[0].address,
          (value: any) => value > 0, // gasUsed should be > 0
          (value: any) => value > 0, // gasPrice should be > 0
          (value: any) => value > 0, // gasCost should be > 0
          "setGreeting",
        );
    });
  });
});
