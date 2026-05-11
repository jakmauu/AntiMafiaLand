import { useOutletContext } from "react-router-dom";
import ChartCard, { DonutVisual, LineVisual } from "../../components/common/ChartCard";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import ProfileSummaryCard from "../../components/common/ProfileSummaryCard";
import StatCard from "../../components/common/StatCard";
import { landColumns, transactionColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getUserDashboardSummary } from "../../services/userApi";

export default function UserDashboard() {
  const { auth, wallet } = useOutletContext();
  const { data, loading, error } = useDashboardData(() => getUserDashboardSummary(wallet.walletAddress), [wallet.walletAddress]);
  if (loading) return <LoadingState label="Loading user dashboard..." />;
  if (error) return <ErrorState message={error} />;
  const summary = data?.summary ?? {};
  return (
    <>
      <ProfileSummaryCard auth={auth} walletAddress={wallet.walletAddress || summary.walletAddress} network={data?.network} roleLabel="Verified User" />
      <section className="stats-grid">
        <StatCard label="My Lands" value={summary.myLands} delta={summary.verificationStatus} tone="purple" />
        <StatCard label="Pending Requests" value={summary.pendingRequests} delta="Live" tone="yellow" />
        <StatCard label="Approved Certificates" value={summary.approvedCertificates} delta="Owned" tone="green" />
        <StatCard label="Rejected Requests" value={summary.rejectedRequests} delta="Frozen" tone="red" />
        <StatCard label="Transaction History" value={summary.transactionHistory} delta="Sepolia" tone="blue" />
        <StatCard label="Risk Score" value={summary.riskScore} delta="Latest" tone="violet" />
      </section>
      <section className="chart-grid compact-charts"><ChartCard title="User Transaction Trend"><LineVisual data={(data?.recentActivity ?? []).map((_, index) => ({ value: index + 1 }))} /></ChartCard><ChartCard title="User Risk Status"><DonutVisual data={data?.transfers?.map((item) => ({ riskLevel: item.riskLevel, count: 1 })) ?? []} /></ChartCard></section>
      <section className="bottom-grid full-bottom"><DataTable title="User Owned Lands" columns={landColumns} rows={data?.ownedLands ?? []} /><DataTable title="Recent User Activity" columns={transactionColumns} rows={data?.recentActivity ?? []} /></section>
    </>
  );
}
