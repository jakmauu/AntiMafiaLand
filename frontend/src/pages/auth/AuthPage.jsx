import { useState } from "react";
import logo from "../../assets/logo.png";
import { login, register } from "../../services/authApi";

export default function AuthPage({ onAuth, statusMessage, setStatusMessage }) {
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ fullName: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);

  async function submitLogin(e) {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await login(loginForm);
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
      await register(registerForm);
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
        <img className="login-hero-logo" src={logo} alt="Anti Mafia Land System logo" />
        <p className="eyebrow">Anti Mafia Land System</p>
        <h1>Secure land registry powered by blockchain.</h1>
        <p>Portal registrasi tanah, validasi risiko, dan transfer kepemilikan dengan smart contract Sepolia.</p>
        <div className="login-metrics"><span>Sepolia</span><span>MetaMask</span><span>Smart Contract</span></div>
      </div>
      <div className="login-card">
        <div className="login-card-brand">
          <img src={logo} alt="Anti Mafia Land System logo" />
          <div>
            <strong>Anti Mafia Land</strong>
            <span>Blockchain Registry</span>
          </div>
        </div>
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
            <label>Role<select value={registerForm.role} onChange={(e) => setRegisterForm((p) => ({ ...p, role: e.target.value }))}><option value="user">User</option><option value="admin">Admin</option></select></label>
            <button className="primary big-button" disabled={loading} type="submit">{loading ? "Loading..." : "Create Account"}</button>
          </form>
        )}
        <p className="message compact-message">{statusMessage}</p>
      </div>
    </section>
  );
}
