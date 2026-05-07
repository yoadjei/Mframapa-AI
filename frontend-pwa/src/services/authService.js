import { httpClient, normalizeError } from "./httpClient.js";

function shouldUseLocalFallback(error) {
  const status = error?.response?.status;
  return !status || status === 404 || status >= 500;
}

function buildLocalSession(email) {
  return {
    token: `local-${Date.now()}`,
    user: {
      id: email,
      email,
      fullName: email.split("@")[0],
    },
  };
}

async function authenticate(endpoint, payload) {
  try {
    const response = await httpClient.post(endpoint, payload);
    return {
      token: response.data.access_token ?? response.data.token,
      user: response.data.user ?? { email: payload.email, fullName: payload.email },
    };
  } catch (error) {
    if (import.meta.env.DEV && shouldUseLocalFallback(error)) {
      return buildLocalSession(payload.email);
    }
    throw new Error(normalizeError(error, "Authentication failed"));
  }
}

export function login({ email, password }) {
  return authenticate("/api/v1/auth/login", { email, password });
}

export function signup({ fullName, email, password }) {
  return authenticate("/api/v1/auth/signup", { full_name: fullName, email, password });
}
