import { useOutletContext } from "react-router-dom";
import ChartCard, { DonutVisual } from "../../components/common/ChartCard";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import StatCard from "../../components/common/StatCard";
import { transferColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getUserDashboardSummary } from "../../services/userApi";

export default function RiskStatus() {
  const { wallet } = useOutletContext();
  const { data, loading, error } = useDashboardData(() => getUserDashboardSummary(wallet.walletAddress), [wallet.walletAddress]);
  if (loading) return <LoadingState label="Loading risk status..." />;
  if (error) return <ErrorState message={error} />;
  return (
    <>
      <section className="stats-grid"><StatCard label="Current Risk Score" value={data?.summary?.riskScore} delta="Latest" tone="violet" /><StatCard label="Pending Requests" value={data?.summary?.pendingRequests} delta="Live" tone="yellow" /><StatCard label="Rejected Requests" value={data?.summary?.rejectedRequests} delta="Frozen" tone="red" /></section>
      <section className="chart-grid compact-charts"><ChartCard title="Risk Distribution"><DonutVisual data={data?.transfers?.map((item) => ({ riskLevel: item.riskLevel, count: 1 })) ?? []} /></ChartCard></section>
      <DataTable title="Risk Check Completed" columns={transferColumns} rows={data?.transfers ?? []} />
    </>
  );
}
