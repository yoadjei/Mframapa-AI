import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, Session, SupabaseClient, AuthError } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/constants';

const STORAGE_KEY = 'mframapa-supabase-auth';

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client. Returns null if env vars are missing —
 * callers should treat that as "auth not configured" and fall back to
 * a clear error message rather than crashing.
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (__DEV__) {
      console.warn(
        '[Mframapa] Supabase env vars missing — EXPO_PUBLIC_SUPABASE_URL and ' +
          'EXPO_PUBLIC_SUPABASE_ANON_KEY must be set in .env',
      );
    }
    return null;
  }
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      storageKey: STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return _client;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  session?: Session | null;
}

function formatAuthError(err: AuthError | null, fallback: string): string {
  if (!err) return fallback;
  const raw = (err.message || '').toLowerCase();
  if (!raw || raw.includes('network') || raw.includes('failed to fetch'))
    return 'You appear to be offline. Check your connection and try again.';
  if (raw.includes('already registered') || raw.includes('already exists') || raw.includes('user already'))
    return 'An account already uses this email. Try signing in, or reset your password.';
  if (raw.includes('invalid login') || raw.includes('invalid credentials'))
    return 'That email and password do not match. Check them and try again.';
  if (raw.includes('not confirmed'))
    return 'Please confirm your email first. Check your inbox for the link.';
  if (raw.includes('rate limit') || raw.includes('too many') || raw.includes('over_email_send'))
    return 'Too many attempts. Please wait a minute and try again.';
  if (raw.includes('password') && (raw.includes('least') || raw.includes('short') || raw.includes('weak')))
    return 'Use at least 8 characters.';
  if (raw.includes('unable to validate email') || raw.includes('invalid email'))
    return 'That does not look like an email address.';
  return err.message || fallback;
}

/** supabase hides a duplicate signup as a fake success with empty identities. */
function isExistingEmail(data: { user?: { identities?: unknown[] } | null }): boolean {
  const ids = data?.user?.identities;
  return Array.isArray(ids) && ids.length === 0;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'Authentication is not configured. Please contact support.' };
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: formatAuthError(error, 'Sign in failed') };
  return { ok: true, session: data.session };
}

export async function signUpWithPassword(
  email: string,
  password: string,
  homeCity?: { name: string; lat: number; lon: number } | null,
  firstName?: string,
): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'Authentication is not configured. Please contact support.' };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        // keyed as full_name to match signIn's hydration and updateProfile's
        // write — first_name here would never be read back after a fresh login.
        ...(firstName ? { full_name: firstName } : {}),
        ...(homeCity ? { home_city: homeCity.name, home_lat: homeCity.lat, home_lon: homeCity.lon } : {}),
      },
    },
  });
  if (error) return { ok: false, error: formatAuthError(error, 'Sign up failed') };
  if (isExistingEmail(data)) {
    return { ok: false, error: 'An account already uses this email. Try signing in, or reset your password.' };
  }
  return { ok: true, session: data.session };
}

export async function signOutSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: 'Authentication is not configured.' };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { ok: false, error: formatAuthError(error, 'Could not send reset link') };
  return { ok: true };
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(
  cb: (session: Session | null) => void,
): { unsubscribe: () => void } {
  const supabase = getSupabase();
  if (!supabase) return { unsubscribe: () => {} };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return { unsubscribe: () => data.subscription.unsubscribe() };
}
