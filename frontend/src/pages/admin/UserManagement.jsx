import DataTable from "../../components/common/DataTable";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { userColumns } from "../../components/common/tableColumns.jsx";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getAllUsers } from "../../services/adminApi";

export default function UserManagement() {
  const { data, loading, error } = useDashboardData(getAllUsers, []);
  if (loading) return <LoadingState label="Loading users..." />;
  if (error) return <ErrorState message={error} />;
  return <DataTable title="User Management" columns={userColumns} rows={data?.users ?? []} />;
}
