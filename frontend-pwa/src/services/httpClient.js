import axios from "axios";
import { supabase } from "./supabase.js";

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

// take the token straight from supabase so it is always current (it refreshes
// before expiry). anonymous visitors simply send no token — the api allows that
// for core features, so nothing here should ever block an unauthenticated user.
httpClient.interceptors.request.use(async (config) => {
  try {
    const { data } = (await supabase?.auth.getSession()) ?? { data: {} };
    const token = data?.session?.access_token;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    /* not signed in — continue anonymously */
  }
  return config;
});

// if a request 401s, the stored session token is stale/expired: drop it and retry
// once anonymously so core (public) features keep working instead of getting stuck.
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error?.response?.status === 401 && original && !original._retriedAnon) {
      original._retriedAnon = true;
      if (original.headers) delete original.headers.Authorization;
      // Drop a stale JWT so later calls stay anonymous (same as mobile).
      try {
        await supabase?.auth.signOut({ scope: "local" });
      } catch {
        /* ignore */
      }
      return httpClient(original);
    }
    return Promise.reject(error);
  }
);

export function normalizeError(error, fallbackMessage = "Request failed") {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage
  );
}
