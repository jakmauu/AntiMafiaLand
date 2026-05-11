import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const CONTRACT_ABI = ["function requestTransfer(uint256 _landId, address _to) public"];

function shortAddress(address) {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function statusText(health, contractAddress) {
  if (!health) return "Need check";
  if (health.ok && contractAddress) return "Operational";
  return "Attention";
}

function AuthPage({ onAuth, statusMessage, setStatusMessage }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
    return data;
  }

  async function submitLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify(loginForm),
      });
      onAuth(data);
      setStatusMessage(`Login berhasil sebagai ${data.user.role}.`);
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitRegister(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await request("/auth/register", {
        method: "POST",
        body: JSON.stringify(registerForm),
      });
      setStatusMessage("Register berhasil. Silakan login.");
      setMode("login");
      setLoginForm({ email: registerForm.email, password: "" });
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="login-shell">
      <div className="login-visual">
        <p className="eyebrow">Anti Mafia Land System</p>
        <h1>Secure land registry powered by blockchain.</h1>
        <p>
          Portal registrasi tanah, validasi risiko, dan transfer kepemilikan dengan smart contract Sepolia.
        </p>
        <div className="login-metrics">
          <span>Sepolia</span>
          <span>MetaMask</span>
          <span>Smart Contract</span>
        </div>
      </div>

      <div className="login-card">
        <p className="eyebrow">TerraChain Access</p>
        <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
        <p className="subtext">Masuk sebagai admin atau user. Data akun disimpan ke database proyek.</p>

        <div className="role-row">
          <button className={`role-pill ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")} type="button">Login</button>
          <button className={`role-pill ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")} type="button">Register</button>
        </div>

        {mode === "login" ? (
          <form className="login-form" onSubmit={submitLogin}>
            <label>Email<input type="email" value={loginForm.email} onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))} required /></label>
            <label>Password<input type="password" value={loginForm.password} onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))} required /></label>
            <button className="primary big-button" disabled={loading} type="submit">{loading ? "Loading..." : "Login"}</button>
          </form>
        ) : (
          <form className="login-form" onSubmit={submitRegister}>
            <label>Full Name<input type="text" value={registerForm.fullName} onChange={(e) => setRegisterForm((p) => ({ ...p, fullName: e.target.value }))} required /></label>
            <label>Email<input type="email" value={registerForm.email} onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))} required /></label>
            <label>Password<input type="password" minLength={6} value={registerForm.password} onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))} required /></label>
            <label>Role
              <select value={registerForm.role} onChange={(e) => setRegisterForm((p) => ({ ...p, role: e.target.value }))}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="primary big-button" disabled={loading} type="submit">{loading ? "Loading..." : "Create Account"}</button>
          </form>
        )}

        <p className="message compact-message">{statusMessage}</p>
      </div>
    </section>
  );
}

function Sidebar({ isAdmin, onLogout }) {
  const adminMenus = [
    "Dashboard",
    "Land Registry",
    "Land Verification",
    "Transactions",
    "Risk Detection",
    "User Management",
    "Profile",
  ];
  const userMenus = ["Dashboard", "My Lands", "Transactions", "Risk Detection", "Profile"];
  const menus = isAdmin ? adminMenus : userMenus;

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">AM</div>
        <div>
          <strong>ANTI MAFIA</strong>
          <span>LAND SYSTEM</span>
        </div>
      </div>

      <nav className="side-nav">
        {menus.map((menu, index) => (
          <a className={index === 0 ? "active" : ""} href="#dashboard" key={menu}>
            <span className="nav-dot" />
            {menu}
          </a>
        ))}
      </nav>

      <div className="sidebar-status">
        <span className="status-led" />
        <strong>System Status</strong>
        <small>Blockchain network connected</small>
      </div>

      <button className="sidebar-logout" onClick={onLogout}>Logout</button>
    </aside>
  );
}

function Topbar({ title, walletAddress, onCheckHealth, onConnectWallet, loading, isBusy, auth }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="menu-button" type="button">=</button>
        <div>
          <p className="top-kicker">Anti Mafia Land System</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <span>Search</span>
          <input aria-label="Search" placeholder="Search anything..." />
        </div>
        <button className="icon-button" type="button" aria-label="Notifications">N</button>
        <button className="network-pill" onClick={onCheckHealth} disabled={isBusy} type="button">
          {loading === "health" ? "Checking..." : "Sepolia"}
        </button>
        <button className="wallet-pill" onClick={onConnectWallet} disabled={isBusy} type="button">
          {loading === "wallet" ? "Connecting..." : shortAddress(walletAddress)}
        </button>
        <div className="avatar-block">
          <div className="avatar">{auth.user.fullName?.slice(0, 1)?.toUpperCase() ?? "U"}</div>
          <div>
            <strong>{auth.user.fullName}</strong>
            <span>{auth.user.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function ProfilePanel({ auth, walletAddress, health, contractAddress, isAdmin }) {
  const joinedDate = auth.user.createdAt
    ? new Date(auth.user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Project account";

  return (
    <section className="profile-panel">
      <div className="profile-main">
        <div className="profile-photo">{auth.user.fullName?.slice(0, 1)?.toUpperCase() ?? "U"}</div>
        <div>
          <div className="profile-title-row">
            <h2>{auth.user.fullName}</h2>
            <span className="role-badge">{isAdmin ? "Administrator" : "Verified User"}</span>
          </div>
          <p>{isAdmin ? "System Administrator" : "Land Owner Account"}</p>
        </div>
      </div>

      <div className="profile-details">
        <div>
          <span>Wallet Address</span>
          <strong>{shortAddress(walletAddress)}</strong>
        </div>
        <div>
          <span>Joined Date</span>
          <strong>{joinedDate}</strong>
        </div>
        <div>
          <span>Role</span>
          <strong>{isAdmin ? "System Administrator" : "User"}</strong>
        </div>
        <div>
          <span>System Status</span>
          <strong className="green-text">{statusText(health, contractAddress)}</strong>
        </div>
      </div>

      <div className="contract-crest">
        <span>Contract</span>
        <strong>{shortAddress(contractAddress)}</strong>
        <small>Sepolia Testnet</small>
      </div>
    </section>
  );
}

function StatCard({ label, value, delta, tone = "blue" }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}>{label.slice(0, 1)}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={delta?.startsWith("-") ? "negative" : "positive"}>{delta}</small>
      </div>
    </article>
  );
}

function ChartCard({ title, type = "line", children }) {
  return (
    <article className="chart-card">
      <div className="card-heading">
        <h3>{title}</h3>
        <button className="mini-select" type="button">This Month</button>
      </div>
      {children ?? (type === "line" ? <LineVisual /> : <DonutVisual />)}
    </article>
  );
}

function LineVisual() {
  return (
    <div className="line-visual">
      <div className="grid-lines" />
      <svg viewBox="0 0 420 190" role="img" aria-label="Land registration trend">
        <path className="area-path" d="M15 165 L52 110 L89 124 L126 86 L163 96 L200 62 L237 78 L274 52 L311 36 L348 48 L390 20 L390 170 L15 170 Z" />
        <path className="line-path" d="M15 165 L52 110 L89 124 L126 86 L163 96 L200 62 L237 78 L274 52 L311 36 L348 48 L390 20" />
        <circle cx="200" cy="62" r="5" />
      </svg>
      <span>Registered Lands</span>
    </div>
  );
}

function DonutVisual() {
  return (
    <div className="donut-wrap">
      <div className="donut-chart"><strong>2,458</strong><span>Total</span></div>
      <ul className="legend-list">
        <li><span className="legend green" />Low Risk <b>67.2%</b></li>
        <li><span className="legend yellow" />Medium <b>22.1%</b></li>
        <li><span className="legend orange" />High <b>7.6%</b></li>
        <li><span className="legend red" />Critical <b>3.1%</b></li>
      </ul>
    </div>
  );
}

function BarVisual() {
  const regions = [
    ["Jakarta", "92%", "2,458"],
    ["West Java", "78%", "2,120"],
    ["Central Java", "68%", "1,856"],
    ["East Java", "52%", "1,423"],
    ["Bali", "36%", "985"],
  ];
  return (
    <div className="bar-list">
      {regions.map(([name, width, count]) => (
        <div className="bar-row" key={name}>
          <span>{name}</span>
          <div><i style={{ width }} /></div>
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  );
}

function VerificationVisual() {
  return (
    <div className="donut-wrap">
      <div className="donut-chart verification"><strong>12,583</strong><span>Total</span></div>
      <ul className="legend-list">
        <li><span className="legend green" />Approved <b>78.4%</b></li>
        <li><span className="legend yellow" />Pending <b>9.9%</b></li>
        <li><span className="legend red" />Rejected <b>7.1%</b></li>
        <li><span className="legend blue" />Review <b>4.6%</b></li>
      </ul>
    </div>
  );
}

function DataTable({ isAdmin, landData, transferData }) {
  const adminRows = [
    ["0x8f3a...de45f8", "Land Registration", "LAND-2026-0001", "Jakarta Selatan", "Low", "Approved"],
    ["0x7c2b...a1f9c3", "Ownership Transfer", "LAND-2026-0002", "Bandung", "Medium", "Pending"],
    ["0x9d1e...b2c4d5", "Risk Check", "LAND-2026-0003", "Surabaya", "High", "Review"],
  ];
  const userRows = [
    ["Current Lookup", "Land Data", landData?.land?.[0] ?? "-", shortAddress(landData?.land?.[1] ?? ""), "Active", landData ? "Found" : "Waiting"],
    ["Transfer Lookup", "Transfer", transferData?.transfer?.[2] ?? "-", shortAddress(transferData?.transfer?.[1] ?? ""), transferData?.riskLabel ?? "-", transferData?.statusLabel ?? "Waiting"],
  ];
  const rows = isAdmin ? adminRows : userRows;

  return (
    <article className="data-table-card">
      <div className="card-heading">
        <h3>{isAdmin ? "Recent Transactions" : "My Land Activity"}</h3>
        <button className="mini-select" type="button">View All</button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>TX / Ref</th>
              <th>Type</th>
              <th>Land ID</th>
              <th>{isAdmin ? "Location" : "Related Wallet"}</th>
              <th>Risk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.join("")}>
                {row.map((cell, index) => (
                  <td key={`${cell}-${index}`}>
                    {index >= 4 ? <span className={`table-badge ${String(cell).toLowerCase()}`}>{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ActivityList({ isAdmin }) {
  const items = isAdmin
    ? ["New land submission received", "Risk score validated", "Ownership transfer approved", "Smart contract health checked"]
    : ["Certificate submitted", "Ownership transfer requested", "Verification approved", "Risk check completed"];

  return (
    <article className="activity-card">
      <h3>Recent Activity</h3>
      {items.map((item, index) => (
        <div className="activity-item" key={item}>
          <span>{index + 1}</span>
          <div>
            <strong>{item}</strong>
            <small>{index + 1} hour ago</small>
          </div>
        </div>
      ))}
    </article>
  );
}

function StatusConsole({ statusMessage, health, contractAddress }) {
  return (
    <section className="status-console">
      <div>
        <span>Live Status</span>
        <strong>{statusMessage}</strong>
      </div>
      <div>
        <span>Contract</span>
        <code>{contractAddress || "Click Check Backend"}</code>
      </div>
      {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : null}
    </section>
  );
}

function Field({ label, children }) {
  return <label className="field-label"><span>{label}</span>{children}</label>;
}

function OperationsPanel({
  isAdmin,
  isBusy,
  loading,
  requestInput,
  setRequestInput,
  handleRequestTransfer,
  registerInput,
  setRegisterInput,
  handleRegisterLand,
  validateInput,
  setValidateInput,
  handleValidateRisk,
  adminLandId,
  setAdminLandId,
  runAdminAction,
  landLookupId,
  setLandLookupId,
  getLand,
  transferLookupId,
  setTransferLookupId,
  getTransfer,
  landData,
  transferData,
}) {
  return (
    <section className="operations-grid">
      {isAdmin ? (
        <>
          <article className="operation-card wide-op">
            <h3>Land Registry Action</h3>
            <div className="form-grid three-cols">
              <Field label="Owner Address"><input type="text" value={registerInput.owner} onChange={(e)=>setRegisterInput((p)=>({...p, owner:e.target.value}))}/></Field>
              <Field label="Metadata URI"><input type="text" value={registerInput.metadataURI} onChange={(e)=>setRegisterInput((p)=>({...p, metadataURI:e.target.value}))}/></Field>
              <Field label="Price"><input type="text" value={registerInput.price} onChange={(e)=>setRegisterInput((p)=>({...p, price:e.target.value}))}/></Field>
            </div>
            <button className="primary" onClick={handleRegisterLand} disabled={isBusy}>{loading === "register-land" ? "Processing..." : "Register Land"}</button>
          </article>

          <article className="operation-card">
            <h3>Risk Detection</h3>
            <div className="form-grid">
              <Field label="Land ID"><input type="number" value={validateInput.landId} onChange={(e)=>setValidateInput((p)=>({...p, landId:e.target.value}))}/></Field>
              <Field label="Risk Score"><input type="number" min="0" max="100" value={validateInput.riskScore} onChange={(e)=>setValidateInput((p)=>({...p, riskScore:e.target.value}))}/></Field>
            </div>
            <button className="primary" onClick={handleValidateRisk} disabled={isBusy}>{loading === "validate" ? "Validating..." : "Validate Risk"}</button>
          </article>

          <article className="operation-card">
            <h3>Verification Control</h3>
            <Field label="Land ID"><input type="number" value={adminLandId} onChange={(e)=>setAdminLandId(e.target.value)} /></Field>
            <div className="button-row compact-row">
              <button className="ghost" onClick={()=>runAdminAction("/admin/approve-transfer","Approve Pending")} disabled={isBusy}>Approve</button>
              <button className="ghost" onClick={()=>runAdminAction("/admin/execute-transfer","Execute Approved")} disabled={isBusy}>Execute</button>
              <button className="danger" onClick={()=>runAdminAction("/admin/freeze-transfer","Freeze Transfer")} disabled={isBusy}>Freeze</button>
            </div>
          </article>
        </>
      ) : (
        <article className="operation-card wide-op">
          <h3>Ownership Transfer Request</h3>
          <p className="helper-text">Only the current land owner wallet can request transfer.</p>
          <div className="form-grid three-cols">
            <Field label="Land ID"><input type="number" value={requestInput.landId} onChange={(e)=>setRequestInput((p)=>({...p, landId:e.target.value}))}/></Field>
            <Field label="Recipient Wallet"><input type="text" value={requestInput.to} onChange={(e)=>setRequestInput((p)=>({...p, to:e.target.value}))}/></Field>
            <button className="primary align-end" onClick={handleRequestTransfer} disabled={isBusy}>{loading === "request" ? "Submitting..." : "Request Transfer"}</button>
          </div>
        </article>
      )}

      <article className="operation-card lookup-card">
        <h3>Land Lookup</h3>
        <div className="inline-input">
          <input type="number" value={landLookupId} onChange={(e)=>setLandLookupId(e.target.value)} />
          <button className="ghost" onClick={getLand} disabled={isBusy}>Get Land</button>
        </div>
        {landData ? <pre>{JSON.stringify(landData, null, 2)}</pre> : <p className="empty-state">No land lookup yet.</p>}
      </article>

      <article className="operation-card lookup-card">
        <h3>Transfer Lookup</h3>
        <div className="inline-input">
          <input type="number" value={transferLookupId} onChange={(e)=>setTransferLookupId(e.target.value)} />
          <button className="ghost" onClick={getTransfer} disabled={isBusy}>Get Transfer</button>
        </div>
        {transferData ? <pre>{JSON.stringify(transferData, null, 2)}</pre> : <p className="empty-state">No transfer lookup yet.</p>}
      </article>
    </section>
  );
}

function DashboardContent(props) {
  const { auth, walletAddress, health, contractAddress, isAdmin, landData, transferData } = props;

  const adminStats = [
    ["Total Registered Lands", landData?.land?.[0] ? `#${landData.land[0]}` : "12,583", "+12.5%", "purple"],
    ["Pending Verification", transferData?.statusLabel === "Pending" ? "1 Active" : "1,247", "+8.3%", "yellow"],
    ["Approved Certificates", transferData?.statusLabel === "Approved" ? "Approved" : "9,856", "+15.7%", "green"],
    ["Suspicious Transactions", transferData?.riskLabel === "High" ? "1 Alert" : "156", "-5.2%", "red"],
    ["Total Users", "3,892", "+10.3%", "blue"],
    ["Smart Contract Status", contractAddress ? "Active" : "Need Check", "Sepolia", "violet"],
  ];

  const userStats = [
    ["My Lands", landData?.land?.[0] ? `Land #${landData.land[0]}` : "Lookup", "Active", "purple"],
    ["Pending Requests", transferData?.statusLabel === "Pending" ? "1" : "0", "Current", "yellow"],
    ["Approved Certificates", transferData?.statusLabel === "Approved" ? "1" : "0", "Verified", "green"],
    ["Rejected Requests", transferData?.statusLabel === "Frozen" ? "1" : "0", "Safe", "red"],
    ["Transaction History", transferData ? "Synced" : "Waiting", "Sepolia", "blue"],
    ["Risk Score", transferData?.transfer?.[3] ?? "-", transferData?.riskLabel ?? "No data", "violet"],
  ];

  const stats = isAdmin ? adminStats : userStats;

  return (
    <>
      <ProfilePanel auth={auth} walletAddress={walletAddress} health={health} contractAddress={contractAddress} isAdmin={isAdmin} />

      <section className="stats-grid">
        {stats.map(([label, value, delta, tone]) => <StatCard key={label} label={label} value={value} delta={delta} tone={tone} />)}
      </section>

      <section className="chart-grid">
        <ChartCard title="Land Registration Trend" />
        <ChartCard title="Transaction Risk Distribution" type="donut" />
        <ChartCard title="Verification Status"><VerificationVisual /></ChartCard>
        <ChartCard title="Top Regions by Registered Land"><BarVisual /></ChartCard>
      </section>

      <OperationsPanel {...props} />

      <section className="bottom-grid">
        <DataTable isAdmin={isAdmin} landData={landData} transferData={transferData} />
        <ActivityList isAdmin={isAdmin} />
      </section>
    </>
  );
}

function App() {
  const [auth, setAuth] = useState(null);
  const [health, setHealth] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Silakan login terlebih dulu.");
  const [loading, setLoading] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [registerInput, setRegisterInput] = useState({ owner: "", metadataURI: "", price: "1000" });
  const [requestInput, setRequestInput] = useState({ landId: "1", to: "" });
  const [validateInput, setValidateInput] = useState({ landId: "1", riskScore: "25" });
  const [adminLandId, setAdminLandId] = useState("1");
  const [landLookupId, setLandLookupId] = useState("1");
  const [transferLookupId, setTransferLookupId] = useState("1");
  const [landData, setLandData] = useState(null);
  const [transferData, setTransferData] = useState(null);

  const isBusy = useMemo(() => loading.length > 0, [loading]);
  const isAdmin = auth?.user?.role === "admin";

  useEffect(() => {
    const raw = localStorage.getItem("terra_auth");
    if (raw) {
      try {
        setAuth(JSON.parse(raw));
      } catch {
        localStorage.removeItem("terra_auth");
      }
    }
  }, []);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
    return data;
  }

  function handleAuth(data) {
    setAuth(data);
    localStorage.setItem("terra_auth", JSON.stringify(data));
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem("terra_auth");
    setStatusMessage("Logout berhasil.");
  }

  async function checkHealth() {
    try {
      setLoading("health");
      const [h, cfg] = await Promise.all([request("/health"), request("/config")]);
      setHealth(h);
      setContractAddress(cfg.contractAddress || "");
      setStatusMessage("Backend dan kontrak siap.");
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi.");
      setLoading("wallet");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0] || "");
      setStatusMessage("Wallet terhubung.");
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  async function handleRequestTransfer() {
    try {
      if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi.");
      if (!contractAddress) throw new Error("Contract address belum dimuat.");
      setLoading("request");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      const tx = await contract.requestTransfer(BigInt(requestInput.landId), requestInput.to);
      await tx.wait();
      setStatusMessage(`requestTransfer sukses. Tx: ${tx.hash}`);
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  async function handleRegisterLand() {
    try {
      setLoading("register-land");
      const data = await request("/admin/register-land", { method: "POST", body: JSON.stringify(registerInput) });
      setStatusMessage(`Register land sukses. Tx: ${data.txHash}`);
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  async function handleValidateRisk() {
    try {
      setLoading("validate");
      const data = await request("/admin/validate-risk", { method: "POST", body: JSON.stringify(validateInput) });
      setStatusMessage(`Validate risk sukses. Tx: ${data.txHash}`);
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  async function runAdminAction(path, label) {
    try {
      setLoading(path);
      const data = await request(path, { method: "POST", body: JSON.stringify({ landId: adminLandId }) });
      setStatusMessage(`${label} sukses. Tx: ${data.txHash}`);
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  async function getLand() {
    try {
      setLoading("land");
      const data = await request(`/lands/${landLookupId}`);
      setLandData(data);
      setStatusMessage("Land data berhasil dimuat.");
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  async function getTransfer() {
    try {
      setLoading("transfer");
      const data = await request(`/transfers/${transferLookupId}`);
      setTransferData(data);
      setStatusMessage("Transfer data berhasil dimuat.");
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  if (!auth) {
    return <AuthPage onAuth={handleAuth} statusMessage={statusMessage} setStatusMessage={setStatusMessage} />;
  }

  const dashboardProps = {
    auth,
    walletAddress,
    health,
    contractAddress,
    isAdmin,
    isBusy,
    loading,
    requestInput,
    setRequestInput,
    handleRequestTransfer,
    registerInput,
    setRegisterInput,
    handleRegisterLand,
    validateInput,
    setValidateInput,
    handleValidateRisk,
    adminLandId,
    setAdminLandId,
    runAdminAction,
    landLookupId,
    setLandLookupId,
    getLand,
    transferLookupId,
    setTransferLookupId,
    getTransfer,
    landData,
    transferData,
  };

  return (
    <div className="dashboard-shell" id="dashboard">
      <Sidebar isAdmin={isAdmin} onLogout={logout} />
      <div className="dashboard-main">
        <Topbar
          title={isAdmin ? "Admin Dashboard" : "User Dashboard"}
          walletAddress={walletAddress}
          onCheckHealth={checkHealth}
          onConnectWallet={connectWallet}
          loading={loading}
          isBusy={isBusy}
          auth={auth}
        />
        <main className="dashboard-content">
          <StatusConsole statusMessage={statusMessage} health={health} contractAddress={contractAddress} />
          <DashboardContent {...dashboardProps} />
        </main>
      </div>
    </div>
  );
}

export default App;
