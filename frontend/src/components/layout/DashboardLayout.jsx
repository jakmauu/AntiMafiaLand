import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useLocation } from "react-router-dom";

const routeTitles = {
  "/admin/dashboard": "Admin Dashboard",
  "/admin/land-registry": "Land Registry",
  "/admin/land-verification": "Land Verification",
  "/admin/transactions": "Transactions",
  "/admin/risk-detection": "Risk Detection",
  "/admin/user-management": "User Management",
  "/admin/profile": "Admin Profile",
  "/user/dashboard": "User Dashboard",
  "/user/my-lands": "My Lands",
  "/user/verification": "Verification",
  "/user/transactions": "Transactions",
  "/user/risk-status": "Risk Status",
  "/user/profile": "User Profile",
};

export default function DashboardLayout({ title, auth, wallet, system, onLogout, children }) {
  const location = useLocation();
  const resolvedTitle = routeTitles[location.pathname] ?? title;
  return (
    <div className="dashboard-shell">
      <Sidebar role={auth?.user?.role} onLogout={onLogout} />
      <div className="dashboard-main">
        <Topbar
          title={resolvedTitle}
          auth={auth}
          walletAddress={wallet.walletAddress}
          walletLoading={wallet.walletLoading}
          onConnectWallet={wallet.connectWallet}
          onCheckHealth={system.checkHealth}
          healthLoading={system.healthLoading}
        />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
