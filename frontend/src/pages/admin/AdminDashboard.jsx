import { useOutletContext } from "react-router-dom";
import ChartCard, { BarVisual, DonutVisual, LineVisual } from "../../components/common/ChartCard";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import ProfileSummaryCard from "../../components/common/ProfileSummaryCard";
import StatCard from "../../components/common/StatCard";
import { transactionColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getAdminDashboardSummary } from "../../services/adminApi";

export default function AdminDashboard() {
  const { auth, wallet } = useOutletContext();
  const { data, loading, error } = useDashboardData(getAdminDashboardSummary, []);

  if (loading) return <LoadingState label="Loading admin dashboard..." />;
  if (error) return <ErrorState message={error} />;

  const summary = data?.summary ?? {};
  return (
    <>
      <ProfileSummaryCard auth={auth} walletAddress={wallet.walletAddress || data?.network?.adminWalletAddress} network={data?.network} roleLabel="System Administrator" />
      <section className="stats-grid">
        <StatCard label="Total Registered Lands" value={summary.totalRegisteredLands} delta="From contract" tone="purple" />
        <StatCard label="Pending Verification" value={summary.pendingVerification} delta="Live" tone="yellow" />
        <StatCard label="Approved Certificates" value={summary.approvedCertificates} delta="Live" tone="green" />
        <StatCard label="Suspicious Transactions" value={summary.suspiciousTransactions} delta="Risk" tone="red" />
        <StatCard label="Total Users" value={summary.totalUsers} delta="Database" tone="blue" />
        <StatCard label="Smart Contract Status" value={summary.smartContractStatus} delta={data?.network?.name} tone="violet" />
      </section>
      <section className="chart-grid">
        <ChartCard title="Land Registration Trend"><LineVisual data={data?.landRegistrationTrend ?? []} /></ChartCard>
        <ChartCard title="Transaction Risk Distribution"><DonutVisual data={data?.riskDistribution ?? []} /></ChartCard>
        <ChartCard title="Verification Status"><DonutVisual data={data?.verificationSummary ?? []} labelKey="status" /></ChartCard>
        <ChartCard title="Top Regions by Registered Land"><BarVisual data={data?.topRegions ?? []} /></ChartCard>
      </section>
      <section className="bottom-grid full-bottom">
        <DataTable title="Recent Transactions" columns={transactionColumns} rows={data?.recentTransactions ?? []} />
        <article className="activity-card"><h3>Quick Overview</h3><div className="activity-item"><span>1</span><div><strong>Contract</strong><small>{data?.network?.contractAddress}</small></div></div><div className="activity-item"><span>2</span><div><strong>Network</strong><small>{data?.network?.name}</small></div></div><div className="activity-item"><span>3</span><div><strong>Latest Block</strong><small>{data?.network?.latestBlock ?? "-"}</small></div></div></article>
      </section>
    </>
  );
}
