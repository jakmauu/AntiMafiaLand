import { apiRequest } from "./apiClient";

export function login(payload) {
  return apiRequest("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export function register(payload) {
  return apiRequest("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}
