import { supabase } from "./supabase.js";
import { authErrorKey, isExistingEmail } from "./authErrors.js";

// auth must fail closed: a fabricated local session would look signed-in to the ui
// but carries no valid token, so every api call 401s — and in a misconfigured
// production build it would let anyone "log in".
function requireSupabase() {
  if (!supabase) {
    throw new Error(
      "Authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }
}

export async function login({ email, password }) {
  requireSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { const e = new Error(error.message); e.key = authErrorKey(error); throw e; }

  return {
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.user_metadata?.first_name ?? null,
      homeCity: homeFromMeta(data.user.user_metadata),
    },
  };
}

/** the home city a user chose at sign-up, if any. */
function homeFromMeta(meta) {
  if (!meta?.home_city) return null;
  return { name: meta.home_city, lat: meta.home_lat, lon: meta.home_lon };
}

export async function signup({ firstName, email, password, homeCity }) {
  requireSupabase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // send the confirmation link back to wherever the app is actually running,
      // not supabase's Site URL default (which was still localhost). the Site
      // URL must also be set in the supabase dashboard as the trusted origin.
      emailRedirectTo: `${window.location.origin}/`,
      data: {
        ...(firstName ? { first_name: firstName } : {}),
        ...(homeCity ? { home_city: homeCity.name, home_lat: homeCity.lat, home_lon: homeCity.lon } : {}),
      },
    },
  });
  if (error) { const e = new Error(error.message); e.key = authErrorKey(error); throw e; }

  // supabase hides a duplicate signup as a fake success (empty identities) to
  // avoid enumeration; catch it so we do not tell the user to check an inbox for
  // an email that will never arrive.
  if (isExistingEmail(data)) {
    const e = new Error("email already registered");
    e.key = "auth.error.email_taken";
    throw e;
  }

  // no session means email confirmation is required — the user is NOT signed in
  // yet. never fabricate a token; surface a pending state so the ui asks them to
  // confirm their email instead of pretending they're authenticated.
  if (!data.session) {
    return { pending: true, email: data.user?.email ?? email };
  }
  return {
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName: data.user.user_metadata?.first_name ?? firstName ?? null,
    },
  };
}

// restore a persisted session on app start (supabase refreshes it if near expiry).
export async function restoreSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) return null;
  return {
    token: session.access_token,
    user: {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.user_metadata?.first_name ?? null,
      homeCity: homeFromMeta(session.user.user_metadata),
    },
  };
}

// notify on sign-in / sign-out (e.g. token refresh, logout in another tab).
export function onAuthChange(handler) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
}

export async function logout() {
  await supabase?.auth.signOut();
}

export async function resetPassword(email) {
  if (!supabase) throw new Error("Auth service not configured.");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) { const e = new Error(error.message); e.key = authErrorKey(error); throw e; }
}
