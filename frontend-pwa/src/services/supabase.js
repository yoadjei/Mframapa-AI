import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function warnBadSupabaseConfig(url) {
  if (!url || typeof url !== "string") return;
  const lower = url.toLowerCase();
  // Prod builds must not point auth at localhost — magic links will open nowhere.
  if (import.meta.env.PROD && (lower.includes("localhost") || lower.includes("127.0.0.1"))) {
    console.error(
      "[mframapa] VITE_SUPABASE_URL looks like localhost in a production build. " +
        "Set the Supabase Site URL to https://mframapa.live (see docs/SUPABASE_AUTH.md)."
    );
  }
}

warnBadSupabaseConfig(supabaseUrl);

// sliding session: persistSession stores the refresh token, autoRefreshToken
// silently exchanges it for a fresh access token before expiry. the result is
// sign in once, stay signed in while you keep using the app. the inactivity
// cutoff (we want ~60 days) is a server setting, not a client one:
//   Supabase dashboard -> Authentication -> Sessions -> Inactivity timeout.
// tying sessions to ip was considered and rejected: african mobile ips change
// constantly, so it would sign people out mid-use and, on shared NAT, could
// match a session to the wrong person.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
