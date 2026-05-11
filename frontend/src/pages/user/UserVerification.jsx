import { useOutletContext } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { transferColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getUserDashboardSummary } from "../../services/userApi";

export default function UserVerification() {
  const { wallet } = useOutletContext();
  const { data, loading, error } = useDashboardData(() => getUserDashboardSummary(wallet.walletAddress), [wallet.walletAddress]);
  if (loading) return <LoadingState label="Loading verification status..." />;
  if (error) return <ErrorState message={error} />;
  return <DataTable title="My Verification Requests" columns={transferColumns} rows={data?.transfers ?? []} />;
}
