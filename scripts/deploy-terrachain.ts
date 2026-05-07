import { network } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const { ethers } = await network.connect();

function upsertEnvValue(filePath: string, key: string, value: string) {
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const line = `${key}=${value}`;
  const next = current.match(new RegExp(`^${key}=`, "m"))
    ? current.replace(new RegExp(`^${key}=.*`, "m"), line)
    : `${current.trimEnd()}\n${line}\n`;

  fs.writeFileSync(filePath, next);
}

async function main() {
  const contract = await ethers.deployContract("TerraChainSimple");
  await contract.waitForDeployment();
  const address = await contract.getAddress();

  const deploymentsDir = path.resolve("deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });
  fs.writeFileSync(
    path.join(deploymentsDir, "latest.json"),
    `${JSON.stringify({ contractName: "TerraChainSimple", address }, null, 2)}\n`,
  );

  upsertEnvValue(path.resolve("backend/.env"), "CONTRACT_ADDRESS", address);

  console.log("TerraChainSimple deployed to:", address);
  console.log("Updated backend/.env CONTRACT_ADDRESS");
  console.log("Wrote deployments/latest.json");
}

await main();
