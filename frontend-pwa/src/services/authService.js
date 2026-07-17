import { supabase } from "./supabase.js";
import { normalizeError } from "./httpClient.js";

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

export async function login({ email, password }) {
  if (!supabase) return buildLocalSession(email);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  return {
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: data.user.user_metadata?.full_name ?? data.user.email,
    },
  };
}

export async function signup({ fullName, email, password }) {
  if (!supabase) return buildLocalSession(email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw new Error(error.message);

  // Supabase returns a session immediately when email confirmation is disabled.
  // If email confirmation is required, session is null — return a pending state.
  const token = data.session?.access_token ?? `pending-${Date.now()}`;
  return {
    token,
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: fullName,
    },
  };
}

export async function logout() {
  await supabase?.auth.signOut();
}

export async function resetPassword(email) {
  if (!supabase) throw new Error("Auth service not configured.");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`,
  });
  if (error) throw new Error(error.message);
}
