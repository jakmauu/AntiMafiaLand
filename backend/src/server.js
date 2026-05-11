import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

const PORT = Number(process.env.PORT ?? 3001);
const RPC_URL = process.env.RPC_URL ?? "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS ?? "";
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "change_this_secret";
const DATABASE_URL = process.env.DATABASE_URL ?? "";

const artifactCandidates = [
  path.resolve(__dirname, "../artifacts/contracts/TerraChainSimple.sol/TerraChainSimple.json"),
  path.resolve(__dirname, "../../artifacts/contracts/TerraChainSimple.sol/TerraChainSimple.json"),
];
const artifactPath = artifactCandidates.find((candidate) => fs.existsSync(candidate));

if (!artifactPath) {
  throw new Error(
    `Contract artifact not found. Checked: ${artifactCandidates.join(", ")}`,
  );
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = ADMIN_PRIVATE_KEY ? new ethers.Wallet(ADMIN_PRIVATE_KEY, provider) : null;

const readContract =
  CONTRACT_ADDRESS && ethers.isAddress(CONTRACT_ADDRESS)
    ? new ethers.Contract(CONTRACT_ADDRESS, abi, provider)
    : null;
const writeContract = signer && readContract ? readContract.connect(signer) : null;

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;

function normalizeDatabaseUrl(databaseUrl) {
  if (!databaseUrl) return "";

  try {
    const url = new URL(databaseUrl);
    // Some hosted Postgres URLs include sslmode=require, which pg parses in a way
    // that can override our rejectUnauthorized setting on Railway.
    url.searchParams.delete("sslmode");
    url.searchParams.delete("sslcert");
    url.searchParams.delete("sslkey");
    url.searchParams.delete("sslrootcert");
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

const normalizedDatabaseUrl = normalizeDatabaseUrl(DATABASE_URL);
const pool = DATABASE_URL
  ? new Pool({
      connectionString: normalizedDatabaseUrl,
      ssl:
        DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1")
          ? false
          : { rejectUnauthorized: false },
    })
  : null;

async function dbRun(sql, params = []) {
  if (!pool) throw new Error("DATABASE_URL belum di-set.");
  const result = await pool.query(sql, params);
  return result;
}

async function dbGet(sql, params = []) {
  if (!pool) throw new Error("DATABASE_URL belum di-set.");
  const result = await pool.query(sql, params);
  return result.rows[0] ?? null;
}

async function initDb() {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const admin = await dbGet("SELECT id FROM users WHERE email = $1", ["admin@terrachain.local"]);
  if (!admin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await dbRun(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)",
      ["System Admin", "admin@terrachain.local", passwordHash, "admin"],
    );
  }
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.full_name },
    JWT_SECRET,
    { expiresIn: "12h" },
  );
}

function toSafeJson(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(toSafeJson);
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = toSafeJson(v);
    return out;
  }
  return value;
}

function ensureReadContract(res) {
  if (!readContract) {
    res.status(500).json({ error: "CONTRACT_ADDRESS belum valid." });
    return false;
  }
  return true;
}

function ensureWriteContract(res) {
  if (!ensureReadContract(res)) return false;
  if (!signer || !ADMIN_PRIVATE_KEY || !writeContract) {
    res.status(500).json({ error: "ADMIN_PRIVATE_KEY belum valid." });
    return false;
  }
  return true;
}

const RISK_LEVEL = ["Low", "Medium", "High"];
const TRANSFER_STATUS = ["None", "Pending", "Approved", "Frozen"];
const EVENT_LOOKBACK_BLOCKS = Number(process.env.EVENT_LOOKBACK_BLOCKS ?? 250000);
const MAX_LAND_SCAN = Number(process.env.MAX_LAND_SCAN ?? 300);

function getNetworkName() {
  const url = RPC_URL.toLowerCase();
  if (url.includes("sepolia")) return "Ethereum Sepolia";
  if (url.includes("mainnet")) return "Ethereum Mainnet";
  if (url.includes("127.0.0.1") || url.includes("localhost")) return "Local Hardhat";
  return "Configured RPC";
}

function normalizeLand(land) {
  const safe = toSafeJson(land);
  return {
    landId: safe[0],
    owner: safe[1],
    metadataURI: safe[2],
    price: safe[3],
    lastTransferTime: safe[4],
    exists: safe[5],
  };
}

function normalizeTransfer(transfer) {
  const safe = toSafeJson(transfer);
  const riskIndex = Number(safe[4] ?? 0);
  const statusIndex = Number(safe[5] ?? 0);
  return {
    from: safe[0],
    to: safe[1],
    landId: safe[2],
    riskScore: safe[3],
    riskLevel: RISK_LEVEL[riskIndex] ?? "Unknown",
    status: TRANSFER_STATUS[statusIndex] ?? "Unknown",
    statusIndex,
    riskIndex,
  };
}

async function getLatestBlock() {
  try {
    return await provider.getBlockNumber();
  } catch {
    return null;
  }
}

function getFromBlock(latestBlock) {
  if (!latestBlock) return 0;
  return Math.max(0, latestBlock - EVENT_LOOKBACK_BLOCKS);
}

const blockTimestampCache = new Map();

async function getBlockIso(blockNumber) {
  if (!blockNumber) return null;
  if (blockTimestampCache.has(blockNumber)) return blockTimestampCache.get(blockNumber);
  try {
    const block = await provider.getBlock(blockNumber);
    const iso = block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null;
    blockTimestampCache.set(blockNumber, iso);
    return iso;
  } catch {
    return null;
  }
}

async function queryContractEvents(eventName, args = []) {
  if (!readContract?.filters?.[eventName]) return [];
  const latestBlock = await getLatestBlock();
  const fromBlock = getFromBlock(latestBlock);
  const filter = readContract.filters[eventName](...args);
  try {
    return await readContract.queryFilter(filter, fromBlock, latestBlock ?? "latest");
  } catch {
    return [];
  }
}

async function getTotalRegisteredLands() {
  if (!readContract) return 0;
  try {
    const nextLandId = await readContract.nextLandId();
    return Math.max(Number(nextLandId) - 1, 0);
  } catch {
    return 0;
  }
}

async function getLandList(limit = MAX_LAND_SCAN) {
  if (!readContract) return [];
  const total = await getTotalRegisteredLands();
  const upperBound = Math.min(total, limit);
  const lands = [];

  for (let id = 1; id <= upperBound; id += 1) {
    try {
      const land = normalizeLand(await readContract.getLand(BigInt(id)));
      if (land.exists) lands.push(land);
    } catch {
      // Missing or reverted land reads are skipped so one bad ID does not break the dashboard.
    }
  }

  return lands;
}

async function getTransferList(lands) {
  if (!readContract) return [];
  const transfers = [];

  for (const land of lands) {
    try {
      const transfer = normalizeTransfer(await readContract.getTransferRequest(BigInt(land.landId)));
      if (transfer.status !== "None") transfers.push(transfer);
    } catch {
      // Same defensive behavior as land scans.
    }
  }

  return transfers;
}

async function buildRecentTransactions(limit = 12) {
  if (!readContract) return [];
  const eventNames = [
    "LandRegistered",
    "TransferRequested",
    "RiskValidated",
    "TransferApproved",
    "TransferExecuted",
    "TransferFrozen",
  ];
  const eventGroups = await Promise.all(eventNames.map((eventName) => queryContractEvents(eventName)));
  const events = eventGroups.flat().sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber)).slice(0, limit);

  return Promise.all(
    events.map(async (event) => ({
      txHash: event.transactionHash,
      type: event.fragment?.name ?? "Transaction",
      landId: event.args?.landId?.toString?.() ?? event.args?.[0]?.toString?.() ?? "-",
      from: event.args?.from ?? event.args?.oldOwner ?? event.args?.owner ?? "-",
      to: event.args?.to ?? event.args?.newOwner ?? event.args?.approver ?? "-",
      riskScore: event.args?.riskScore?.toString?.() ?? null,
      riskLevel:
        event.args?.riskLevel !== undefined
          ? RISK_LEVEL[Number(event.args.riskLevel)] ?? "Unknown"
          : null,
      status:
        event.args?.status !== undefined
          ? TRANSFER_STATUS[Number(event.args.status)] ?? "Unknown"
          : event.fragment?.name === "TransferFrozen"
            ? "Frozen"
            : event.fragment?.name === "TransferExecuted"
              ? "Completed"
              : event.fragment?.name === "TransferApproved"
                ? "Approved"
                : event.fragment?.name === "TransferRequested"
                  ? "Pending"
                  : "Recorded",
      blockNumber: event.blockNumber,
      dateTime: await getBlockIso(event.blockNumber),
    })),
  );
}

async function buildTrend() {
  const events = await queryContractEvents("LandRegistered");
  const grouped = {};
  for (const event of events) {
    const iso = await getBlockIso(event.blockNumber);
    const key = iso ? iso.slice(0, 10) : `Block ${event.blockNumber}`;
    grouped[key] = (grouped[key] ?? 0) + 1;
  }
  return Object.entries(grouped).map(([label, value]) => ({ label, value }));
}

function inferRegion(metadataURI = "") {
  const raw = String(metadataURI).toLowerCase();
  if (raw.includes("jakarta")) return "Jakarta";
  if (raw.includes("bandung") || raw.includes("jawa-barat") || raw.includes("west-java")) return "West Java";
  if (raw.includes("surabaya") || raw.includes("east-java") || raw.includes("jawa-timur")) return "East Java";
  if (raw.includes("bali")) return "Bali";
  if (raw.includes("medan") || raw.includes("sumatra")) return "North Sumatra";
  if (raw.includes("semarang") || raw.includes("central-java") || raw.includes("jawa-tengah")) return "Central Java";
  return "Unspecified";
}

function buildTopRegions(lands) {
  const grouped = {};
  for (const land of lands) {
    const region = inferRegion(land.metadataURI);
    grouped[region] = (grouped[region] ?? 0) + 1;
  }
  return Object.entries(grouped)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

async function buildDashboardModel(walletAddress = "") {
  const [lands, recentTransactions, trend, latestBlock] = await Promise.all([
    getLandList(),
    buildRecentTransactions(),
    buildTrend(),
    getLatestBlock(),
  ]);
  const transfers = await getTransferList(lands);
  const usersCountRow = pool ? await dbGet("SELECT COUNT(*)::int AS count FROM users") : { count: 0 };
  const pending = transfers.filter((transfer) => transfer.status === "Pending");
  const approved = transfers.filter((transfer) => transfer.status === "Approved");
  const frozen = transfers.filter((transfer) => transfer.status === "Frozen");
  const riskDistribution = RISK_LEVEL.map((riskLevel) => ({
    riskLevel,
    count: transfers.filter((transfer) => transfer.riskLevel === riskLevel).length,
  }));
  const verificationSummary = TRANSFER_STATUS.map((status) => ({
    status,
    count: status === "None" ? 0 : transfers.filter((transfer) => transfer.status === status).length,
  }));
  const normalizedWallet = walletAddress.toLowerCase();
  const userLands = normalizedWallet
    ? lands.filter((land) => String(land.owner).toLowerCase() === normalizedWallet)
    : [];
  const userTransfers = normalizedWallet
    ? transfers.filter(
        (transfer) =>
          String(transfer.from).toLowerCase() === normalizedWallet ||
          String(transfer.to).toLowerCase() === normalizedWallet,
      )
    : [];

  return {
    network: {
      name: getNetworkName(),
      rpcUrl: RPC_URL,
      latestBlock,
      contractAddress: CONTRACT_ADDRESS,
      smartContractStatus: readContract ? "Active" : "Unavailable",
      adminWalletAddress: signer?.address ?? null,
    },
    admin: {
      summary: {
        totalRegisteredLands: lands.length,
        pendingVerification: pending.length,
        approvedCertificates: approved.length,
        suspiciousTransactions: frozen.length + transfers.filter((transfer) => transfer.riskLevel === "High").length,
        totalUsers: Number(usersCountRow?.count ?? 0),
        smartContractStatus: readContract ? "Active" : "Unavailable",
      },
      recentTransactions,
      verificationSummary,
      riskDistribution,
      topRegions: buildTopRegions(lands),
      landRegistrationTrend: trend,
      lands,
      transfers,
    },
    user: {
      summary: {
        myLands: userLands.length,
        pendingRequests: userTransfers.filter((transfer) => transfer.status === "Pending").length,
        approvedCertificates: userTransfers.filter((transfer) => transfer.status === "Approved").length + userLands.length,
        rejectedRequests: userTransfers.filter((transfer) => transfer.status === "Frozen").length,
        transactionHistory: userTransfers.length,
        riskScore: userTransfers[0]?.riskScore ?? "0",
        walletAddress,
        verificationStatus: userLands.length > 0 ? "Verified Owner" : "No registered land",
      },
      recentActivity: recentTransactions.filter(
        (tx) =>
          String(tx.from).toLowerCase() === normalizedWallet ||
          String(tx.to).toLowerCase() === normalizedWallet,
      ),
      ownedLands: userLands,
      transfers: userTransfers,
    },
  };
}

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "TerraChain backend running" });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body ?? {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "fullName, email, password wajib diisi." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password minimal 6 karakter." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedRole = role === "admin" ? "admin" : "user";
    const exists = await dbGet("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (exists) return res.status(409).json({ error: "Email sudah terdaftar." });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await dbRun(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [String(fullName).trim(), normalizedEmail, passwordHash, normalizedRole],
    );

    const user = await dbGet("SELECT id, full_name, email, role, created_at FROM users WHERE id = $1", [
      created.rows[0].id,
    ]);

    res.status(201).json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await dbGet("SELECT * FROM users WHERE email = $1", [normalizedEmail]);
    if (!user) return res.status(401).json({ error: "Email atau password salah." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Email atau password salah." });

    const token = signToken(user);
    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/config", (_req, res) => {
  res.json({ contractAddress: CONTRACT_ADDRESS, hasContractAddress: Boolean(CONTRACT_ADDRESS) });
});

app.get("/health", async (_req, res) => {
  let latestBlock = null;
  try {
    latestBlock = await provider.getBlockNumber();
  } catch {
    latestBlock = null;
  }

  res.json({
    ok: true,
    rpcUrl: RPC_URL,
    networkName: getNetworkName(),
    hasContractAddress: Boolean(CONTRACT_ADDRESS),
    hasAdminPrivateKey: Boolean(ADMIN_PRIVATE_KEY),
    hasDatabaseUrl: Boolean(DATABASE_URL),
    latestBlock,
  });
});

app.get("/admin/dashboard-summary", async (_req, res) => {
  try {
    const data = await buildDashboardModel();
    res.json({
      ...data.admin,
      network: data.network,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/user/dashboard-summary", async (req, res) => {
  try {
    const wallet = String(req.query.wallet ?? "");
    const data = await buildDashboardModel(wallet);
    res.json({
      ...data.user,
      network: data.network,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/admin/users", async (_req, res) => {
  try {
    const result = await dbRun(
      "SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC",
    );
    res.json({
      users: result.rows.map((user) => ({
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        walletAddress: null,
        status: "Active",
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/admin/pending-verifications", async (_req, res) => {
  try {
    const lands = await getLandList();
    const transfers = await getTransferList(lands);
    res.json({ verifications: transfers.filter((transfer) => transfer.status === "Pending") });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/lands", async (req, res) => {
  try {
    const wallet = String(req.query.wallet ?? "").toLowerCase();
    const lands = await getLandList();
    res.json({
      lands: wallet ? lands.filter((land) => String(land.owner).toLowerCase() === wallet) : lands,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/transactions", async (req, res) => {
  try {
    const wallet = String(req.query.wallet ?? "").toLowerCase();
    const transactions = await buildRecentTransactions(50);
    res.json({
      transactions: wallet
        ? transactions.filter(
            (tx) =>
              String(tx.from).toLowerCase() === wallet ||
              String(tx.to).toLowerCase() === wallet,
          )
        : transactions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/land-registration-trend", async (_req, res) => {
  try {
    res.json({ trend: await buildTrend() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/verification-summary", async (_req, res) => {
  try {
    const lands = await getLandList();
    const transfers = await getTransferList(lands);
    res.json({
      summary: TRANSFER_STATUS.map((status) => ({
        status,
        count: status === "None" ? 0 : transfers.filter((transfer) => transfer.status === status).length,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/risk-distribution", async (_req, res) => {
  try {
    const lands = await getLandList();
    const transfers = await getTransferList(lands);
    res.json({
      distribution: RISK_LEVEL.map((riskLevel) => ({
        riskLevel,
        count: transfers.filter((transfer) => transfer.riskLevel === riskLevel).length,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analytics/top-regions", async (_req, res) => {
  try {
    const lands = await getLandList();
    res.json({ regions: buildTopRegions(lands) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/lands/:landId", async (req, res) => {
  if (!ensureReadContract(res)) return;
  try {
    const land = await readContract.getLand(BigInt(req.params.landId));
    res.json({ land: toSafeJson(land) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/transfers/:landId", async (req, res) => {
  if (!ensureReadContract(res)) return;
  try {
    const transfer = await readContract.getTransferRequest(BigInt(req.params.landId));
    const status = Number(transfer.status);
    const risk = Number(transfer.riskLevel);
    res.json({
      transfer: toSafeJson(transfer),
      statusLabel: TRANSFER_STATUS[status] ?? "Unknown",
      riskLabel: RISK_LEVEL[risk] ?? "Unknown",
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
    res.json({ ok: true, txHash: receipt.hash, blockNumber: receipt.blockNumber });
  } catch (error) {
    res.status(400).json({ error: error.message });
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

await initDb();

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
