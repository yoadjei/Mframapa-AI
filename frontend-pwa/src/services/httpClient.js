import axios from "axios";
import { SESSION_KEY } from "../state/appState.jsx";

const baseURL = import.meta.env.VITE_API_URL || "";

// signed-in users authenticate with their supabase token (attached below).
// VITE_API_KEY is only for institutional/API access and is normally unset —
// never fall back to a built-in key, that would ship a credential to every browser.
const apiKey = import.meta.env.VITE_API_KEY;

export const httpClient = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    ...(apiKey ? { "X-API-Key": apiKey } : {}),
  },
});

httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem(SESSION_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function normalizeError(error, fallbackMessage = "Request failed") {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
}
