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
const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes("localhost")
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
    hasContractAddress: Boolean(CONTRACT_ADDRESS),
    hasAdminPrivateKey: Boolean(ADMIN_PRIVATE_KEY),
    hasDatabaseUrl: Boolean(DATABASE_URL),
    latestBlock,
  });
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
