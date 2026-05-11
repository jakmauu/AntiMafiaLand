import { useOutletContext } from "react-router-dom";
import ProfileSummaryCard from "../../components/common/ProfileSummaryCard";
import ErrorState from "../../components/common/ErrorState";
import LoadingState from "../../components/common/LoadingState";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getUserDashboardSummary } from "../../services/userApi";

export default function UserProfile() {
  const { auth, wallet } = useOutletContext();
  const { data, loading, error } = useDashboardData(() => getUserDashboardSummary(wallet.walletAddress), [wallet.walletAddress]);
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  return <ProfileSummaryCard auth={auth} walletAddress={wallet.walletAddress} network={data?.network} roleLabel="Verified User" />;
}
