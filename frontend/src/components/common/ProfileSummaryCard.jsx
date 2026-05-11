import { shortAddress } from "../../utils/format";

export default function ProfileSummaryCard({ auth, walletAddress, network, roleLabel }) {
  const joinedDate = auth?.user?.createdAt ? new Date(auth.user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Project account";
  return (
    <section className="profile-panel">
      <div className="profile-main">
        <div className="profile-photo">{auth?.user?.fullName?.slice(0, 1)?.toUpperCase() ?? "U"}</div>
        <div>
          <div className="profile-title-row"><h2>{auth?.user?.fullName}</h2><span className="role-badge">{roleLabel}</span></div>
          <p>{auth?.user?.role === "admin" ? "System Administrator" : "Land Owner Account"}</p>
        </div>
      </div>
      <div className="profile-details">
        <div><span>Wallet Address</span><strong>{shortAddress(walletAddress)}</strong></div>
        <div><span>Joined Date</span><strong>{joinedDate}</strong></div>
        <div><span>Role</span><strong>{roleLabel}</strong></div>
        <div><span>System Status</span><strong className="green-text">{network?.smartContractStatus ?? "Need check"}</strong></div>
      </div>
      <div className="contract-crest"><span>Contract</span><strong>{shortAddress(network?.contractAddress)}</strong><small>{network?.name ?? "Sepolia"}</small></div>
    </section>
  );
}
