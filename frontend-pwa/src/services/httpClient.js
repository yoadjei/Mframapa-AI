import axios from "axios";
import { SESSION_KEY } from "../state/appState.jsx";

const baseURL = import.meta.env.VITE_API_URL || "";

export const httpClient = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
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
