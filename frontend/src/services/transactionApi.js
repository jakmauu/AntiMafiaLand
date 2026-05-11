import { apiRequest, buildQuery } from "./apiClient";

export function getRecentTransactions(params = {}) {
  return apiRequest(`/transactions${buildQuery(params)}`);
}

export function getTransfer(landId) {
  return apiRequest(`/transfers/${landId}`);
}
