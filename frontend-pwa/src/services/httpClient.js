import axios from "axios";
import { supabase } from "./supabase.js";

const baseURL = import.meta.env.VITE_API_URL || "";

// signed-in users authenticate with their supabase token (attached below).
// VITE_API_KEY is only for institutional/API access and is normally unset —
// never fall back to a built-in key, that would ship a credential to every browser.
const apiKey = import.meta.env.VITE_API_KEY;

export const httpClient = axios.create({
  baseURL,
  // Predict can stall >20s on cold upstreams; keep below SW networkTimeout.
  timeout: 45000,
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

// Home fires several requests (predict, daily-fact, events, welcome) at once
// on load. If the shared token is bad, they all 401 within the same tick —
// and each independently calling supabase.auth.refreshSession() races them
// against each other. Supabase refresh tokens are single-use: the first
// concurrent call rotates it and succeeds, the rest are then trying to
// redeem a refresh token that is already spent and fail. Funneling every
// caller through one shared in-flight promise means only one actual refresh
// call ever goes out; everyone else just awaits its result.
let _refreshPromise = null;
function refreshSessionOnce() {
  if (!_refreshPromise) {
    _refreshPromise = supabase.auth.refreshSession().finally(() => {
      _refreshPromise = null;
    });
  }
  return _refreshPromise;
}

// if a request 401s, the backend rejected the token we sent (it deliberately
// refuses a bad credential rather than quietly treating it as anonymous —
// see authenticate_or_anonymous in backend/api/security.py). try once to
// refresh the session and retry with the new token before giving up on it —
// autoRefreshToken only fires on its own proactive timer, it does not react
// to a 401 from us, so a token that the backend has started rejecting (clock
// skew, a rotated signing key, a backend blip) would otherwise sit there and
// get resent, unrefreshed, on every future request forever.
//
// this used to instead call supabase.auth.signOut() unconditionally on any
// 401, on the theory that a 401 always meant the session was dead. it does
// not always mean that — a single endpoint can 401 for reasons that have
// nothing to do with the session being invalid (a backend misconfiguration, a
// transient blip, a route that just requires a different tier). signOut() is
// a real, global sign-out: one unrelated background call failing (e.g. the
// best-effort welcome email sent right after login) was enough to silently
// sign out a user with a perfectly valid session. refreshing first, and only
// falling back to an anonymous retry if that refresh itself fails, fixes a
// merely-stale token without ever forcing a valid one out.
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error?.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    // attempt 1: the request carried a token — try refreshing it and retrying
    // with the new one. this is a separate attempt/flag from the anonymous
    // retry below: a refreshed token can itself still be rejected (the
    // backend problem was never actually about staleness), and that must not
    // consume the one retry a public endpoint needs to fall back to anonymous.
    if (Boolean(original.headers?.Authorization) && !original._retriedRefresh) {
      original._retriedRefresh = true;
      if (supabase) {
        try {
          const { data } = await refreshSessionOnce();
          const token = data?.session?.access_token;
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            return httpClient(original);
          }
        } catch {
          /* refresh failed outright — fall through to the anonymous retry */
        }
      }
    }

    // attempt 2: no token, or refreshing didn't produce one that helped —
    // retry once with no Authorization header so a public endpoint still
    // works for a caller whose session is genuinely unusable right now.
    if (!original._retriedAnon) {
      original._retriedAnon = true;
      if (original.headers) delete original.headers.Authorization;
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
