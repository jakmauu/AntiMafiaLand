import { apiRequest } from "./apiClient";

export function getAdminDashboardSummary() {
  return apiRequest("/admin/dashboard-summary");
}

export function getPendingVerifications() {
  return apiRequest("/admin/pending-verifications");
}

export function getAllUsers() {
  return apiRequest("/admin/users");
}

export function registerLand(payload) {
  return apiRequest("/admin/register-land", { method: "POST", body: JSON.stringify(payload) });
}

export function approveTransfer(landId) {
  return apiRequest("/admin/approve-transfer", { method: "POST", body: JSON.stringify({ landId }) });
}

export function executeTransfer(landId) {
  return apiRequest("/admin/execute-transfer", { method: "POST", body: JSON.stringify({ landId }) });
}

export function freezeTransfer(landId) {
  return apiRequest("/admin/freeze-transfer", { method: "POST", body: JSON.stringify({ landId }) });
}
