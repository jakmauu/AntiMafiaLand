import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { transactionColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getRecentTransactions } from "../../services/transactionApi";

export default function Transactions() {
  const { data, loading, error } = useDashboardData(() => getRecentTransactions(), []);
  if (loading) return <LoadingState label="Loading transactions..." />;
  if (error) return <ErrorState message={error} />;
  return <DataTable title="Ownership Transfer History" columns={transactionColumns} rows={data?.transactions ?? []} />;
}
