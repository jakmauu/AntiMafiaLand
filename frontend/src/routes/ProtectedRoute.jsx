import { Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";

export default function ProtectedRoute({ auth, allowedRole, wallet, system, onLogout }) {
  if (!auth) return <Navigate to="/login" replace />;
  if (allowedRole && auth.user.role !== allowedRole) {
    return <Navigate to={auth.user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"} replace />;
  }

  return (
    <DashboardLayout title={allowedRole === "admin" ? "Admin Dashboard" : "User Dashboard"} auth={auth} wallet={wallet} system={system} onLogout={onLogout}>
      <Outlet context={{ auth, wallet, system }} />
    </DashboardLayout>
  );
}
