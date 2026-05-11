import { apiRequest, buildQuery } from "./apiClient";

export function getLands(params = {}) {
  return apiRequest(`/lands${buildQuery(params)}`);
}

export function getLand(landId) {
  return apiRequest(`/lands/${landId}`);
}
