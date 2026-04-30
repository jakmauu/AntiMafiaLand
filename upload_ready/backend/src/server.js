import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ethers } from "ethers";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const PORT = Number(process.env.PORT ?? 3001);
const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS ?? "";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY ?? "";
const DEFAULT_OWNER_PRIVATE_KEY = process.env.DEFAULT_OWNER_PRIVATE_KEY ?? "";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

const artifactPath = path.resolve(
  __dirname,
  "../../artifacts/contracts/TerraChainSimple.sol/TerraChainSimple.json",
);

if (!fs.existsSync(artifactPath)) {
  throw new Error(
    `Contract artifact not found at ${artifactPath}. Run 'npx.cmd hardhat compile' first.`,
  );
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = ADMIN_PRIVATE_KEY ? new ethers.Wallet(ADMIN_PRIVATE_KEY, provider) : null;
const prisma = new PrismaClient();

const readContract =
  CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS)
    ? new ethers.Contract(CONTRACT_ADDRESS, abi, provider)
    : null;

const writeContract = signer && readContract ? readContract.connect(signer) : null;

const app = express();
app.use(cors());
app.use(express.json());

const RISK_LEVEL = ["Low", "Medium", "High"];
const TRANSFER_STATUS = ["None", "Pending", "Approved", "Frozen"];

function toSafeJson(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(toSafeJson);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      out[key] = toSafeJson(val);
    }
    return out;
  }
  return value;
}

function ensureReadContract(res) {
  if (!readContract) {
    res.status(500).json({
      error:
        "CONTRACT_ADDRESS belum di-set atau tidak valid. Isi .env backend dulu.",
    });
    return false;
  }
  return true;
}

function ensureWriteContract(res) {
  if (!readContract) {
    res.status(500).json({ error: "CONTRACT_ADDRESS belum valid." });
    return false;
  }
  if (!signer || !ADMIN_PRIVATE_KEY) {
    res.status(500).json({ error: "ADMIN_PRIVATE_KEY belum di-set." });
    return false;
  }
  if (!writeContract) {
    res.status(500).json({ error: "Write contract tidak tersedia." });
    return false;
  }
  return true;
}

function calculateRiskScore({
  txFrequency = 0,
  priceDeltaPct = 0,
  walletRelationScore = 0,
  flippingScore = 0,
}) {
  const clamp = (v) => Math.max(0, Math.min(100, Number(v)));
  const freq = clamp(txFrequency);
  const delta = clamp(priceDeltaPct);
  const relation = clamp(walletRelationScore);
  const flipping = clamp(flippingScore);

  const score = Math.round(
    freq * 0.35 + delta * 0.25 + relation * 0.2 + flipping * 0.2,
  );
  const riskScore = Math.max(0, Math.min(100, score));

  const riskLevel = riskScore <= 30 ? "Low" : riskScore <= 70 ? "Medium" : "High";
  const suggestedAction =
    riskLevel === "Low" ? "Approved" : riskLevel === "Medium" ? "Pending" : "Frozen";

  return { riskScore, riskLevel, suggestedAction };
}

app.get("/health", async (_req, res) => {
  let latestBlock = null;
  let database = { ok: false };

  try {
    latestBlock = await provider.getBlockNumber();
  } catch (_err) {
    latestBlock = null;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = { ok: true };
  } catch (err) {
    database = { ok: false, error: err.message };
  }

  res.json({
    ok: true,
    rpcUrl: RPC_URL,
    hasContractAddress: Boolean(CONTRACT_ADDRESS),
    hasAdminPrivateKey: Boolean(ADMIN_PRIVATE_KEY),
    hasDefaultOwnerPrivateKey: Boolean(DEFAULT_OWNER_PRIVATE_KEY),
    hasDatabaseUrl: Boolean(DATABASE_URL),
    latestBlock,
    database,
  });
});

app.post("/risk/score", (req, res) => {
  const result = calculateRiskScore(req.body ?? {});
  res.json(result);
});

app.get("/lands/:landId", async (req, res) => {
  if (!ensureReadContract(res)) return;
  try {
    const landId = BigInt(req.params.landId);
    const land = await readContract.getLand(landId);
    res.json({
      land: toSafeJson(land),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/transfers/:landId", async (req, res) => {
  if (!ensureReadContract(res)) return;
  try {
    const landId = BigInt(req.params.landId);
    const transfer = await readContract.getTransferRequest(landId);
    const rawStatus = Number(transfer.status);
    const rawRisk = Number(transfer.riskLevel);
    res.json({
      transfer: toSafeJson(transfer),
      statusLabel: TRANSFER_STATUS[rawStatus] ?? "Unknown",
      riskLabel: RISK_LEVEL[rawRisk] ?? "Unknown",
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/admin/register-land", async (req, res) => {
  if (!ensureWriteContract(res)) return;
  try {
    const { owner, metadataURI, price } = req.body ?? {};
    if (!owner || !ethers.isAddress(owner)) {
      return res.status(400).json({ error: "owner address tidak valid." });
    }
    if (!metadataURI || typeof metadataURI !== "string") {
      return res.status(400).json({ error: "metadataURI wajib string." });
    }

    const tx = await writeContract.registerLand(owner, metadataURI, BigInt(price ?? 0));
    const receipt = await tx.wait();

    return res.json({
      ok: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.post("/admin/validate-risk", async (req, res) => {
  if (!ensureWriteContract(res)) return;
  try {
    const { landId, riskScore } = req.body ?? {};
    const tx = await writeContract.validateRisk(BigInt(landId), Number(riskScore));
    const receipt = await tx.wait();
    res.json({ ok: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/admin/approve-transfer", async (req, res) => {
  if (!ensureWriteContract(res)) return;
  try {
    const { landId } = req.body ?? {};
    const tx = await writeContract.approvePendingTransfer(BigInt(landId));
    const receipt = await tx.wait();
    res.json({ ok: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/admin/execute-transfer", async (req, res) => {
  if (!ensureWriteContract(res)) return;
  try {
    const { landId } = req.body ?? {};
    const tx = await writeContract.executeApprovedTransfer(BigInt(landId));
    const receipt = await tx.wait();
    res.json({ ok: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/admin/freeze-transfer", async (req, res) => {
  if (!ensureWriteContract(res)) return;
  try {
    const { landId } = req.body ?? {};
    const tx = await writeContract.freezeTransfer(BigInt(landId));
    const receipt = await tx.wait();
    res.json({ ok: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/workflow/auto-transfer", async (req, res) => {
  if (!ensureWriteContract(res)) return;
  if (!ensureReadContract(res)) return;

  try {
    const {
      landId,
      to,
      ownerPrivateKey,
      txFrequency = 0,
      priceDeltaPct = 0,
      walletRelationScore = 0,
      flippingScore = 0,
      autoExecuteLow = true,
    } = req.body ?? {};

    const ownerKey = ownerPrivateKey || DEFAULT_OWNER_PRIVATE_KEY;
    if (!ownerKey) {
      return res.status(400).json({
        error:
          "ownerPrivateKey wajib diisi (atau set DEFAULT_OWNER_PRIVATE_KEY di .env).",
      });
    }
    if (!to || !ethers.isAddress(to)) {
      return res.status(400).json({ error: "Recipient address tidak valid." });
    }

    const parsedLandId = BigInt(landId);
    const ownerWallet = new ethers.Wallet(ownerKey, provider);
    const ownerContract = readContract.connect(ownerWallet);

    const requestTx = await ownerContract.requestTransfer(parsedLandId, to);
    const requestReceipt = await requestTx.wait();

    const ai = calculateRiskScore({
      txFrequency,
      priceDeltaPct,
      walletRelationScore,
      flippingScore,
    });

    const validateTx = await writeContract.validateRisk(parsedLandId, ai.riskScore);
    const validateReceipt = await validateTx.wait();

    const transferAfterValidation = await readContract.getTransferRequest(parsedLandId);
    const statusAfterValidation = Number(transferAfterValidation.status);
    const statusLabel = TRANSFER_STATUS[statusAfterValidation] ?? "Unknown";

    let executeHash = null;
    if (autoExecuteLow && statusLabel === "Approved") {
      const executeTx = await writeContract.executeApprovedTransfer(parsedLandId);
      const executeReceipt = await executeTx.wait();
      executeHash = executeReceipt.hash;
    }

    const landAfterFlow = await readContract.getLand(parsedLandId);
    const transferAfterFlow = await readContract.getTransferRequest(parsedLandId);

    return res.json({
      ok: true,
      ai,
      tx: {
        requestTransfer: requestReceipt.hash,
        validateRisk: validateReceipt.hash,
        executeApprovedTransfer: executeHash,
      },
      statusAfterValidation: statusLabel,
      landAfterFlow: toSafeJson(landAfterFlow),
      transferAfterFlow: toSafeJson(transferAfterFlow),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
