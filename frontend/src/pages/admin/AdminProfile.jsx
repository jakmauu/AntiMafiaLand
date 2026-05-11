import { useOutletContext } from "react-router-dom";
import ProfileSummaryCard from "../../components/common/ProfileSummaryCard";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getAdminDashboardSummary } from "../../services/adminApi";
import LoadingState from "../../components/common/LoadingState";
import ErrorState from "../../components/common/ErrorState";

export default function AdminProfile() {
  const { auth, wallet } = useOutletContext();
  const { data, loading, error } = useDashboardData(getAdminDashboardSummary, []);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  return <ProfileSummaryCard auth={auth} walletAddress={wallet.walletAddress || data?.network?.adminWalletAddress} network={data?.network} roleLabel="System Administrator" />;
}
