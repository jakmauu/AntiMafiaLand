import { shortAddress } from "../../utils/format";

export default function Topbar({ title, auth, walletAddress, walletLoading, onConnectWallet, onCheckHealth, healthLoading }) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="menu-button" type="button">=</button>
        <div><p className="top-kicker">Anti Mafia Land System</p><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <div className="search-box"><span>Search</span><input aria-label="Search" placeholder="Search anything..." /></div>
        <button className="icon-button" type="button" aria-label="Notifications">N</button>
        <button className="network-pill" onClick={onCheckHealth} type="button">{healthLoading ? "Checking..." : "Sepolia"}</button>
        <button className="wallet-pill" onClick={onConnectWallet} type="button">{walletLoading ? "Connecting..." : shortAddress(walletAddress)}</button>
        <div className="avatar-block">
          <div className="avatar">{auth?.user?.fullName?.slice(0, 1)?.toUpperCase() ?? "U"}</div>
          <div><strong>{auth?.user?.fullName}</strong><span>{auth?.user?.role}</span></div>
        </div>
      </div>
    </header>
  );
}
