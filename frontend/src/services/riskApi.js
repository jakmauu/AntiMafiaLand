import { apiRequest } from "./apiClient";

export function validateRisk(payload) {
  return apiRequest("/admin/validate-risk", { method: "POST", body: JSON.stringify(payload) });
}

export function getLandRegistrationTrend() {
  return apiRequest("/analytics/land-registration-trend");
}

export function getVerificationSummary() {
  return apiRequest("/analytics/verification-summary");
}

export function getRiskDistribution() {
  return apiRequest("/analytics/risk-distribution");
}

export function getTopRegions() {
  return apiRequest("/analytics/top-regions");
}
