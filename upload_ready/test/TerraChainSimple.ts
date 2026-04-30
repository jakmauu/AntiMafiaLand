import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("TerraChainSimple", function () {
  it("registerLand should mint ERC721 and store land metadata", async function () {
    const [, ownerA] = await ethers.getSigners();
    const terra = await ethers.deployContract("TerraChainSimple");

    await (await terra.registerLand(ownerA.address, "ipfs://tanah-1", 1000n)).wait();

    expect(await terra.ownerOf(1n)).to.equal(ownerA.address);

    const land = await terra.getLand(1n);
    expect(land.owner).to.equal(ownerA.address);
    expect(land.metadataURI).to.equal("ipfs://tanah-1");
    expect(land.price).to.equal(1000n);
    expect(land.exists).to.equal(true);
  });

  it("low risk flow should auto-approve then execute transfer", async function () {
    const [, ownerA, ownerB] = await ethers.getSigners();
    const terra = await ethers.deployContract("TerraChainSimple");

    await (await terra.registerLand(ownerA.address, "ipfs://tanah-1", 1000n)).wait();
    await (await terra.connect(ownerA).requestTransfer(1n, ownerB.address)).wait();
    await (await terra.validateRisk(1n, 25)).wait();

    const approvedRequest = await terra.getTransferRequest(1n);
    expect(approvedRequest.status).to.equal(2n); // Approved

    await (await terra.executeApprovedTransfer(1n)).wait();
    expect(await terra.ownerOf(1n)).to.equal(ownerB.address);

    const deletedRequest = await terra.getTransferRequest(1n);
    expect(deletedRequest.status).to.equal(0n); // None
  });

  it("medium risk flow should require manual admin approval", async function () {
    const [, ownerA, ownerB] = await ethers.getSigners();
    const terra = await ethers.deployContract("TerraChainSimple");

    await (await terra.registerLand(ownerA.address, "ipfs://tanah-2", 2000n)).wait();
    await (await terra.connect(ownerA).requestTransfer(1n, ownerB.address)).wait();
    await (await terra.validateRisk(1n, 60)).wait();

    const pendingRequest = await terra.getTransferRequest(1n);
    expect(pendingRequest.status).to.equal(1n); // Pending

    await expect(terra.executeApprovedTransfer(1n)).to.be.revertedWith(
      "Transfer not approved",
    );

    await (await terra.approvePendingTransfer(1n)).wait();
    await (await terra.executeApprovedTransfer(1n)).wait();
    expect(await terra.ownerOf(1n)).to.equal(ownerB.address);
  });

  it("high risk should freeze transfer and block execution", async function () {
    const [, ownerA, ownerB] = await ethers.getSigners();
    const terra = await ethers.deployContract("TerraChainSimple");

    await (await terra.registerLand(ownerA.address, "ipfs://tanah-3", 3000n)).wait();
    await (await terra.connect(ownerA).requestTransfer(1n, ownerB.address)).wait();
    await (await terra.validateRisk(1n, 95)).wait();

    const frozenRequest = await terra.getTransferRequest(1n);
    expect(frozenRequest.status).to.equal(3n); // Frozen

    await expect(terra.executeApprovedTransfer(1n)).to.be.revertedWith(
      "Transfer not approved",
    );
  });
});
