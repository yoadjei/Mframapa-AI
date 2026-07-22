import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
