import { useMemo, useState } from "react";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

const RISK_LEVEL_HELP = {
  Low: "Transaksi relatif aman. Sistem bisa lanjut otomatis.",
  Medium: "Perlu review tambahan dari admin/notaris.",
  High: "Risiko tinggi. Transfer sebaiknya dibekukan sementara.",
};

function LoginPanel({ onLogin }) {
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState("user");

  function submitLogin(event) {
    event.preventDefault();
    onLogin({
      name: displayName.trim() || (selectedRole === "admin" ? "Admin" : "Pengguna"),
      role: selectedRole,
    });
  }

  return (
    <section className="login-shell">
      <div className="login-card">
        <p className="eyebrow">TerraChain Access</p>
        <h1>Anti-Mafia Land Dashboard</h1>
        <p className="subtext">
          Pilih mode login untuk menampilkan interface yang sesuai kebutuhan user atau admin.
        </p>

        <form className="login-form" onSubmit={submitLogin}>
          <label>
            Nama
            <input
              type="text"
              placeholder="Contoh: Hilmy"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>

          <div className="role-row" role="radiogroup" aria-label="Pilih role">
            <button
              type="button"
              className={`role-pill ${selectedRole === "user" ? "active" : ""}`}
              onClick={() => setSelectedRole("user")}
            >
              Masuk sebagai User
            </button>
            <button
              type="button"
              className={`role-pill ${selectedRole === "admin" ? "active" : ""}`}
              onClick={() => setSelectedRole("admin")}
            >
              Masuk sebagai Admin
            </button>
          </div>

          <button type="submit" className="primary big-button">
            Login ke {selectedRole === "admin" ? "Admin Panel" : "User Portal"}
          </button>
        </form>
      </div>
    </section>
  );
}

function SessionHeader({ session, loading, onHealthCheck, onLogout }) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">{session.role === "admin" ? "Admin Console" : "User Portal"}</p>
        <h1>{session.role === "admin" ? "Control and Validation" : "Transfer and Tracking"}</h1>
        <p className="subtext">
          Login sebagai <span className="inline-highlight">{session.name}</span>. Gunakan fitur sesuai
          peran untuk menjaga alur transaksi tanah tetap aman dan transparan.
        </p>
      </div>
      <div className="header-actions">
        <button type="button" className="ghost" onClick={onHealthCheck} disabled={loading}>
          {loading ? "Checking..." : "Check Backend"}
        </button>
        <button type="button" className="danger" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

function UserDashboard({
  isBusy,
  loading,
  riskInput,
  setRiskInput,
  riskResult,
  onRiskScore,
  landIdInput,
  setLandIdInput,
  landData,
  onGetLand,
  transferIdInput,
  setTransferIdInput,
  transferData,
  onGetTransfer,
  autoFlowInput,
  setAutoFlowInput,
  autoFlowResult,
  onAutoWorkflow,
}) {
  return (
    <main className="grid">
      <article className="card card-wide">
        <h2>Ajukan Transfer + AI Screening</h2>
        <p className="subtext">
          User mengajukan transfer, lalu sistem menjalankan risk scoring sesuai parameter perilaku.
        </p>
        <div className="form-grid">
          <label>
            Land ID
            <input
              type="number"
              min="1"
              value={autoFlowInput.landId}
              onChange={(event) =>
                setAutoFlowInput((prev) => ({ ...prev, landId: event.target.value }))
              }
            />
          </label>
          <label>
            Recipient Address
            <input
              type="text"
              value={autoFlowInput.to}
              onChange={(event) =>
                setAutoFlowInput((prev) => ({ ...prev, to: event.target.value }))
              }
            />
          </label>
          <label>
            Owner Private Key (Demo)
            <input
              type="password"
              placeholder="Wajib untuk simulasi owner signer"
              value={autoFlowInput.ownerPrivateKey}
              onChange={(event) =>
                setAutoFlowInput((prev) => ({ ...prev, ownerPrivateKey: event.target.value }))
              }
            />
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={autoFlowInput.autoExecuteLow}
              onChange={(event) =>
                setAutoFlowInput((prev) => ({ ...prev, autoExecuteLow: event.target.checked }))
              }
            />
            Auto execute saat low risk
          </label>
        </div>

        <div className="form-grid risk-mini-grid">
          <label>
            Tx Frequency
            <input
              type="number"
              value={riskInput.txFrequency}
              onChange={(event) =>
                setRiskInput((prev) => ({ ...prev, txFrequency: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Price Delta %
            <input
              type="number"
              value={riskInput.priceDeltaPct}
              onChange={(event) =>
                setRiskInput((prev) => ({ ...prev, priceDeltaPct: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Wallet Relation
            <input
              type="number"
              value={riskInput.walletRelationScore}
              onChange={(event) =>
                setRiskInput((prev) => ({
                  ...prev,
                  walletRelationScore: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Flipping Score
            <input
              type="number"
              value={riskInput.flippingScore}
              onChange={(event) =>
                setRiskInput((prev) => ({ ...prev, flippingScore: Number(event.target.value) }))
              }
            />
          </label>
        </div>

        <button type="button" className="primary" disabled={isBusy} onClick={onAutoWorkflow}>
          {loading === "auto-workflow" ? "Running..." : "Run Transfer Workflow"}
        </button>

        {autoFlowResult ? <pre>{JSON.stringify(autoFlowResult, null, 2)}</pre> : null}
      </article>

      <article className="card">
        <h2>Cek Data Tanah</h2>
        <div className="inline-input">
          <input
            type="number"
            min="1"
            value={landIdInput}
            onChange={(event) => setLandIdInput(event.target.value)}
          />
          <button type="button" className="ghost" onClick={onGetLand} disabled={isBusy}>
            {loading === "land" ? "Loading..." : "Get Land"}
          </button>
        </div>
        {landData ? <pre>{JSON.stringify(landData, null, 2)}</pre> : null}
      </article>

      <article className="card">
        <h2>Status Transfer</h2>
        <div className="inline-input">
          <input
            type="number"
            min="1"
            value={transferIdInput}
            onChange={(event) => setTransferIdInput(event.target.value)}
          />
          <button type="button" className="ghost" onClick={onGetTransfer} disabled={isBusy}>
            {loading === "transfer" ? "Loading..." : "Get Transfer"}
          </button>
        </div>
        {transferData ? <pre>{JSON.stringify(transferData, null, 2)}</pre> : null}
      </article>

      <article className="card card-wide">
        <h2>Risk Scoring Preview</h2>
        <p className="subtext">Simulasi cepat untuk memahami posisi risiko sebelum transaksi.</p>
        <button type="button" className="primary" onClick={onRiskScore} disabled={isBusy}>
          {loading === "risk" ? "Calculating..." : "Calculate Risk"}
        </button>
        {riskResult ? (
          <div>
            <pre>{JSON.stringify(riskResult, null, 2)}</pre>
            <p className="message">
              {RISK_LEVEL_HELP[riskResult.riskLevel] ?? "Belum ada interpretasi risiko."}
            </p>
          </div>
        ) : null}
      </article>
    </main>
  );
}

function AdminDashboard({
  isBusy,
  loading,
  registerInput,
  setRegisterInput,
  onRegisterLand,
  adminLandId,
  setAdminLandId,
  runAdminAction,
  landIdInput,
  setLandIdInput,
  landData,
  onGetLand,
  transferIdInput,
  setTransferIdInput,
  transferData,
  onGetTransfer,
  riskInput,
  setRiskInput,
  riskResult,
  onRiskScore,
}) {
  return (
    <main className="grid">
      <article className="card">
        <h2>Register Land</h2>
        <div className="form-grid">
          <label>
            Owner Address
            <input
              type="text"
              value={registerInput.owner}
              onChange={(event) =>
                setRegisterInput((prev) => ({ ...prev, owner: event.target.value }))
              }
            />
          </label>
          <label>
            Metadata URI
            <input
              type="text"
              value={registerInput.metadataURI}
              onChange={(event) =>
                setRegisterInput((prev) => ({ ...prev, metadataURI: event.target.value }))
              }
            />
          </label>
          <label>
            Price
            <input
              type="text"
              value={registerInput.price}
              onChange={(event) =>
                setRegisterInput((prev) => ({ ...prev, price: event.target.value }))
              }
            />
          </label>
        </div>
        <button type="button" className="primary" onClick={onRegisterLand} disabled={isBusy}>
          {loading === "register" ? "Submitting..." : "Register Land"}
        </button>
      </article>

      <article className="card card-wide">
        <h2>Admin Actions</h2>
        <label>
          Land ID
          <input
            type="number"
            min="1"
            value={adminLandId}
            onChange={(event) => setAdminLandId(event.target.value)}
          />
        </label>
        <div className="button-row">
          <button
            type="button"
            className="ghost"
            disabled={isBusy}
            onClick={() => runAdminAction("/admin/approve-transfer", "Pending transfer disetujui")}
          >
            Approve Pending
          </button>
          <button
            type="button"
            className="ghost"
            disabled={isBusy}
            onClick={() => runAdminAction("/admin/execute-transfer", "Approved transfer dieksekusi")}
          >
            Execute Approved
          </button>
          <button
            type="button"
            className="ghost danger"
            disabled={isBusy}
            onClick={() => runAdminAction("/admin/freeze-transfer", "Transfer dibekukan")}
          >
            Freeze Transfer
          </button>
        </div>
      </article>

      <article className="card">
        <h2>Land Lookup</h2>
        <div className="inline-input">
          <input
            type="number"
            min="1"
            value={landIdInput}
            onChange={(event) => setLandIdInput(event.target.value)}
          />
          <button type="button" className="ghost" onClick={onGetLand} disabled={isBusy}>
            {loading === "land" ? "Loading..." : "Get Land"}
          </button>
        </div>
        {landData ? <pre>{JSON.stringify(landData, null, 2)}</pre> : null}
      </article>

      <article className="card">
        <h2>Transfer Lookup</h2>
        <div className="inline-input">
          <input
            type="number"
            min="1"
            value={transferIdInput}
            onChange={(event) => setTransferIdInput(event.target.value)}
          />
          <button type="button" className="ghost" onClick={onGetTransfer} disabled={isBusy}>
            {loading === "transfer" ? "Loading..." : "Get Transfer"}
          </button>
        </div>
        {transferData ? <pre>{JSON.stringify(transferData, null, 2)}</pre> : null}
      </article>

      <article className="card card-wide">
        <h2>Risk Scoring Console</h2>
        <div className="form-grid">
          <label>
            Tx Frequency
            <input
              type="number"
              value={riskInput.txFrequency}
              onChange={(event) =>
                setRiskInput((prev) => ({ ...prev, txFrequency: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Price Delta %
            <input
              type="number"
              value={riskInput.priceDeltaPct}
              onChange={(event) =>
                setRiskInput((prev) => ({ ...prev, priceDeltaPct: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Wallet Relation
            <input
              type="number"
              value={riskInput.walletRelationScore}
              onChange={(event) =>
                setRiskInput((prev) => ({
                  ...prev,
                  walletRelationScore: Number(event.target.value),
                }))
              }
            />
          </label>
          <label>
            Flipping Score
            <input
              type="number"
              value={riskInput.flippingScore}
              onChange={(event) =>
                setRiskInput((prev) => ({ ...prev, flippingScore: Number(event.target.value) }))
              }
            />
          </label>
        </div>
        <button type="button" className="primary" onClick={onRiskScore} disabled={isBusy}>
          {loading === "risk" ? "Calculating..." : "Calculate Risk"}
        </button>
        {riskResult ? <pre>{JSON.stringify(riskResult, null, 2)}</pre> : null}
      </article>
    </main>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [health, setHealth] = useState(null);
  const [riskInput, setRiskInput] = useState({
    txFrequency: 55,
    priceDeltaPct: 40,
    walletRelationScore: 35,
    flippingScore: 25,
  });
  const [riskResult, setRiskResult] = useState(null);
  const [registerInput, setRegisterInput] = useState({
    owner: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    metadataURI: "ipfs://tanah-1",
    price: "1000",
  });
  const [landIdInput, setLandIdInput] = useState("1");
  const [transferIdInput, setTransferIdInput] = useState("1");
  const [landData, setLandData] = useState(null);
  const [transferData, setTransferData] = useState(null);
  const [adminLandId, setAdminLandId] = useState("1");
  const [autoFlowInput, setAutoFlowInput] = useState({
    landId: "1",
    to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    ownerPrivateKey: "",
    autoExecuteLow: true,
  });
  const [autoFlowResult, setAutoFlowResult] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState("");

  const isBusy = useMemo(() => loading.length > 0, [loading]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error ?? `HTTP ${response.status}`);
    }
    return data;
  }

  async function handleHealthCheck() {
    try {
      setLoading("health");
      const data = await request("/health");
      setHealth(data);
      setStatusMessage("Backend aktif dan terkoneksi.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  async function handleRiskScore() {
    try {
      setLoading("risk");
      const data = await request("/risk/score", {
        method: "POST",
        body: JSON.stringify(riskInput),
      });
      setRiskResult(data);
      setStatusMessage("Risk scoring berhasil dihitung.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  async function handleRegisterLand() {
    try {
      setLoading("register");
      const data = await request("/admin/register-land", {
        method: "POST",
        body: JSON.stringify(registerInput),
      });
      setStatusMessage(`Register land berhasil. Tx: ${data.txHash}`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  async function handleGetLand() {
    try {
      setLoading("land");
      const data = await request(`/lands/${landIdInput}`);
      setLandData(data);
      setStatusMessage(`Data land #${landIdInput} berhasil diambil.`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  async function handleGetTransfer() {
    try {
      setLoading("transfer");
      const data = await request(`/transfers/${transferIdInput}`);
      setTransferData(data);
      setStatusMessage(`Data transfer #${transferIdInput} berhasil diambil.`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  async function runAdminAction(path, successText) {
    try {
      setLoading(path);
      const data = await request(path, {
        method: "POST",
        body: JSON.stringify({ landId: adminLandId }),
      });
      setStatusMessage(`${successText}. Tx: ${data.txHash}`);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  async function handleAutoWorkflow() {
    try {
      setLoading("auto-workflow");
      const data = await request("/workflow/auto-transfer", {
        method: "POST",
        body: JSON.stringify({
          landId: autoFlowInput.landId,
          to: autoFlowInput.to,
          ownerPrivateKey: autoFlowInput.ownerPrivateKey,
          autoExecuteLow: autoFlowInput.autoExecuteLow,
          ...riskInput,
        }),
      });
      setAutoFlowResult(data);
      setStatusMessage("Auto workflow berhasil: request transfer dan validasi risk selesai.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading("");
    }
  }

  if (!session) {
    return <LoginPanel onLogin={setSession} />;
  }

  return (
    <div className="page">
      <SessionHeader
        session={session}
        loading={isBusy}
        onHealthCheck={handleHealthCheck}
        onLogout={() => setSession(null)}
      />

      <section className="status-card">
        <p className="label">API Base URL</p>
        <code>{API_BASE_URL}</code>
        <p className="message">{statusMessage || "Siap menjalankan operasi."}</p>
        {health ? <pre>{JSON.stringify(health, null, 2)}</pre> : null}
      </section>

      {session.role === "admin" ? (
        <AdminDashboard
          isBusy={isBusy}
          loading={loading}
          registerInput={registerInput}
          setRegisterInput={setRegisterInput}
          onRegisterLand={handleRegisterLand}
          adminLandId={adminLandId}
          setAdminLandId={setAdminLandId}
          runAdminAction={runAdminAction}
          landIdInput={landIdInput}
          setLandIdInput={setLandIdInput}
          landData={landData}
          onGetLand={handleGetLand}
          transferIdInput={transferIdInput}
          setTransferIdInput={setTransferIdInput}
          transferData={transferData}
          onGetTransfer={handleGetTransfer}
          riskInput={riskInput}
          setRiskInput={setRiskInput}
          riskResult={riskResult}
          onRiskScore={handleRiskScore}
        />
      ) : (
        <UserDashboard
          isBusy={isBusy}
          loading={loading}
          riskInput={riskInput}
          setRiskInput={setRiskInput}
          riskResult={riskResult}
          onRiskScore={handleRiskScore}
          landIdInput={landIdInput}
          setLandIdInput={setLandIdInput}
          landData={landData}
          onGetLand={handleGetLand}
          transferIdInput={transferIdInput}
          setTransferIdInput={setTransferIdInput}
          transferData={transferData}
          onGetTransfer={handleGetTransfer}
          autoFlowInput={autoFlowInput}
          setAutoFlowInput={setAutoFlowInput}
          autoFlowResult={autoFlowResult}
          onAutoWorkflow={handleAutoWorkflow}
        />
      )}
    </div>
  );
}

export default App;
