import { useOutletContext } from "react-router-dom";
import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { transactionColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getRecentTransactions } from "../../services/transactionApi";

export default function UserTransactions() {
  const { wallet } = useOutletContext();
  const { data, loading, error } = useDashboardData(() => getRecentTransactions({ wallet: wallet.walletAddress }), [wallet.walletAddress]);
  if (loading) return <LoadingState label="Loading user transactions..." />;
  if (error) return <ErrorState message={error} />;
  return <DataTable title="My Transaction History" columns={transactionColumns} rows={data?.transactions ?? []} />;
}
