import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AuthPage from "../pages/auth/AuthPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import LandRegistry from "../pages/admin/LandRegistry";
import LandVerification from "../pages/admin/LandVerification";
import AdminTransactions from "../pages/admin/Transactions";
import RiskDetection from "../pages/admin/RiskDetection";
import UserManagement from "../pages/admin/UserManagement";
import AdminProfile from "../pages/admin/AdminProfile";
import UserDashboard from "../pages/user/UserDashboard";
import MyLands from "../pages/user/MyLands";
import UserVerification from "../pages/user/UserVerification";
import UserTransactions from "../pages/user/UserTransactions";
import RiskStatus from "../pages/user/RiskStatus";
import UserProfile from "../pages/user/UserProfile";
import ProtectedRoute from "./ProtectedRoute";
import { useWallet } from "../hooks/useWallet";
import { getConfig, getHealth } from "../services/systemApi";

export default function AppRoutes() {
  const [auth, setAuth] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Silakan login terlebih dulu.");
  const [health, setHealth] = useState(null);
  const [contractAddress, setContractAddress] = useState("");
  const [healthLoading, setHealthLoading] = useState(false);
  const navigate = useNavigate();
  const wallet = useWallet();

  useEffect(() => {
    const raw = localStorage.getItem("terra_auth");
    if (raw) {
      try { setAuth(JSON.parse(raw)); } catch { localStorage.removeItem("terra_auth"); }
    }
  }, []);

  useEffect(() => {
    if (auth) checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.user?.id]);

  async function checkHealth() {
    try {
      setHealthLoading(true);
      const [h, cfg] = await Promise.all([getHealth(), getConfig()]);
      setHealth(h);
      setContractAddress(cfg.contractAddress || "");
      setStatusMessage("Backend dan kontrak siap.");
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setHealthLoading(false);
    }
  }

  function handleAuth(data) {
    setAuth(data);
    localStorage.setItem("terra_auth", JSON.stringify(data));
    navigate(data.user.role === "admin" ? "/admin/dashboard" : "/user/dashboard", { replace: true });
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem("terra_auth");
    setStatusMessage("Logout berhasil.");
    navigate("/login", { replace: true });
  }

  const system = { health, contractAddress, statusMessage, setStatusMessage, checkHealth, healthLoading };

  return (
    <Routes>
      <Route path="/login" element={auth ? <Navigate to={auth.user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"} replace /> : <AuthPage onAuth={handleAuth} statusMessage={statusMessage} setStatusMessage={setStatusMessage} />} />
      <Route path="/admin" element={<ProtectedRoute auth={auth} allowedRole="admin" wallet={wallet} system={system} onLogout={logout} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="land-registry" element={<LandRegistry />} />
        <Route path="land-verification" element={<LandVerification />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="risk-detection" element={<RiskDetection />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>
      <Route path="/user" element={<ProtectedRoute auth={auth} allowedRole="user" wallet={wallet} system={system} onLogout={logout} />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="my-lands" element={<MyLands />} />
        <Route path="verification" element={<UserVerification />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="risk-status" element={<RiskStatus />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
      <Route path="*" element={<Navigate to={auth ? (auth.user.role === "admin" ? "/admin/dashboard" : "/user/dashboard") : "/login"} replace />} />
    </Routes>
  );
}
