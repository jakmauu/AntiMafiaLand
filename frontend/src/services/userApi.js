import { apiRequest, buildQuery } from "./apiClient";

export function getUserDashboardSummary(wallet) {
  return apiRequest(`/user/dashboard-summary${buildQuery({ wallet })}`);
}

export function getUserLands(wallet) {
  return apiRequest(`/lands${buildQuery({ wallet })}`);
}
