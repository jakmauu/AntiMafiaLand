import { NavLink } from "react-router-dom";

const adminMenus = [
  ["Dashboard", "/admin/dashboard"],
  ["Land Registry", "/admin/land-registry"],
  ["Land Verification", "/admin/land-verification"],
  ["Transactions", "/admin/transactions"],
  ["Risk Detection", "/admin/risk-detection"],
  ["User Management", "/admin/user-management"],
  ["Profile", "/admin/profile"],
];

const userMenus = [
  ["Dashboard", "/user/dashboard"],
  ["My Lands", "/user/my-lands"],
  ["Verification", "/user/verification"],
  ["Transactions", "/user/transactions"],
  ["Risk Status", "/user/risk-status"],
  ["Profile", "/user/profile"],
];

export default function Sidebar({ role, onLogout }) {
  const menus = role === "admin" ? adminMenus : userMenus;
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">AM</div>
        <div><strong>ANTI MAFIA</strong><span>LAND SYSTEM</span></div>
      </div>
      <nav className="side-nav">
        {menus.map(([label, path]) => (
          <NavLink to={path} key={path} className={({ isActive }) => (isActive ? "active" : "") }>
            <span className="nav-dot" />{label}
          </NavLink>
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
