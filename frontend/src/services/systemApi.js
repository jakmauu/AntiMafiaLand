import { apiRequest } from "./apiClient";

export function getHealth() {
  return apiRequest("/health");
}

export function getConfig() {
  return apiRequest("/config");
}
