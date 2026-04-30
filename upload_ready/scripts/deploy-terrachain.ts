import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  const contract = await ethers.deployContract("TerraChainSimple");
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("TerraChainSimple deployed to:", address);
}

await main();
