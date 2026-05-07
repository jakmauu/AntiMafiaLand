import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const CONTRACT_ABI = ["function requestTransfer(uint256 _landId, address _to) public"];

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
      <div className="login-card">
        <p className="eyebrow">TerraChain Access</p>
        <h1>Secure Land Registry</h1>
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

        <p className="message">{statusMessage}</p>
      </div>
    </section>
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
    } catch (e) {
      setStatusMessage(e.message);
    } finally {
      setLoading("");
    }
  }

  if (!auth) {
    return <AuthPage onAuth={handleAuth} statusMessage={statusMessage} setStatusMessage={setStatusMessage} />;
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">TerraChain Dashboard</p>
          <h1>Welcome, {auth.user.fullName}</h1>
          <p className="subtext">Role: <b>{auth.user.role}</b> | Wallet: <code>{walletAddress || "not connected"}</code></p>
        </div>
        <div className="button-row">
          <button className="ghost" onClick={checkHealth} disabled={isBusy}>{loading === "health" ? "Checking..." : "Check Backend"}</button>
          <button className="ghost" onClick={connectWallet} disabled={isBusy}>{loading === "wallet" ? "Connecting..." : "Connect Wallet"}</button>
          <button className="danger" onClick={logout}>Logout</button>
        </div>
      </header>

      <section className="status-card">
        <p className="message">{statusMessage}</p>
        <p className="message">Contract: <code>{contractAddress || "(click Check Backend)"}</code></p>
        {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : null}
      </section>

      <main className="grid">
        <article className="card">
          <h2>User: Request Transfer</h2>
          <div className="form-grid">
            <label>Land ID<input type="number" value={requestInput.landId} onChange={(e)=>setRequestInput((p)=>({...p, landId:e.target.value}))}/></label>
            <label>Recipient<input type="text" value={requestInput.to} onChange={(e)=>setRequestInput((p)=>({...p, to:e.target.value}))}/></label>
          </div>
          <button className="primary" onClick={handleRequestTransfer} disabled={isBusy}>Request Transfer</button>
        </article>

        {isAdmin ? (
          <>
            <article className="card">
              <h2>Admin: Register Land</h2>
              <div className="form-grid">
                <label>Owner<input type="text" value={registerInput.owner} onChange={(e)=>setRegisterInput((p)=>({...p, owner:e.target.value}))}/></label>
                <label>Metadata URI<input type="text" value={registerInput.metadataURI} onChange={(e)=>setRegisterInput((p)=>({...p, metadataURI:e.target.value}))}/></label>
                <label>Price<input type="text" value={registerInput.price} onChange={(e)=>setRegisterInput((p)=>({...p, price:e.target.value}))}/></label>
              </div>
              <button className="primary" onClick={handleRegisterLand} disabled={isBusy}>Register Land</button>
            </article>

            <article className="card">
              <h2>Admin: Validate Risk</h2>
              <div className="form-grid">
                <label>Land ID<input type="number" value={validateInput.landId} onChange={(e)=>setValidateInput((p)=>({...p, landId:e.target.value}))}/></label>
                <label>Risk Score<input type="number" min="0" max="100" value={validateInput.riskScore} onChange={(e)=>setValidateInput((p)=>({...p, riskScore:e.target.value}))}/></label>
              </div>
              <button className="primary" onClick={handleValidateRisk} disabled={isBusy}>Validate Risk</button>
            </article>

            <article className="card card-wide">
              <h2>Admin Actions</h2>
              <label>Land ID<input type="number" value={adminLandId} onChange={(e)=>setAdminLandId(e.target.value)} /></label>
              <div className="button-row">
                <button className="ghost" onClick={()=>runAdminAction("/admin/approve-transfer","Approve Pending")} disabled={isBusy}>Approve Pending</button>
                <button className="ghost" onClick={()=>runAdminAction("/admin/execute-transfer","Execute Approved")} disabled={isBusy}>Execute Approved</button>
                <button className="danger" onClick={()=>runAdminAction("/admin/freeze-transfer","Freeze Transfer")} disabled={isBusy}>Freeze Transfer</button>
              </div>
            </article>
          </>
        ) : null}

        <article className="card">
          <h2>Land Lookup</h2>
          <div className="inline-input">
            <input type="number" value={landLookupId} onChange={(e)=>setLandLookupId(e.target.value)} />
            <button className="ghost" onClick={getLand} disabled={isBusy}>Get Land</button>
          </div>
          {landData ? <pre>{JSON.stringify(landData, null, 2)}</pre> : null}
        </article>

        <article className="card">
          <h2>Transfer Lookup</h2>
          <div className="inline-input">
            <input type="number" value={transferLookupId} onChange={(e)=>setTransferLookupId(e.target.value)} />
            <button className="ghost" onClick={getTransfer} disabled={isBusy}>Get Transfer</button>
          </div>
          {transferData ? <pre>{JSON.stringify(transferData, null, 2)}</pre> : null}
        </article>
      </main>
    </div>
  );
}

export default App;
