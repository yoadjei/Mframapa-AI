/**
 * Map auth failures to a stable key the UI can translate.
 *
 * Supabase throws developer-facing strings ("Invalid login credentials",
 * "User already registered") and, worse, hides a duplicate signup as a fake
 * success to avoid email enumeration. Neither is something to put in front of a
 * user. This turns both into one of a small set of clear, translatable outcomes.
 */

/** returns a translation key for an auth error thrown by supabase. */
export function authErrorKey(error) {
  const raw = String(error?.message ?? error ?? "").toLowerCase();

  if (!raw || raw.includes("network") || raw.includes("failed to fetch")) {
    return "auth.error.network";
  }
  if (raw.includes("already registered") || raw.includes("already exists") ||
      raw.includes("user already")) {
    return "auth.error.email_taken";
  }
  if (raw.includes("invalid login") || raw.includes("invalid credentials")) {
    return "auth.error.invalid_credentials";
  }
  if (raw.includes("email not confirmed") || raw.includes("not confirmed")) {
    return "auth.error.email_unconfirmed";
  }
  if (raw.includes("rate limit") || raw.includes("too many") ||
      raw.includes("over_email_send")) {
    return "auth.error.rate_limited";
  }
  if (raw.includes("password") && (raw.includes("least") || raw.includes("short") ||
      raw.includes("weak"))) {
    return "auth.error.password_short";
  }
  if (raw.includes("unable to validate email") || raw.includes("invalid email")) {
    return "auth.error.email_invalid";
  }
  if (raw.includes("user not found")) {
    return "auth.error.no_account";
  }
  return "auth.error.generic";
}

/**
 * Detect the obfuscated "email already exists" case.
 *
 * With email confirmation on, signUp does not error for an existing address; it
 * returns a user with an empty identities array and no session. Surfacing this
 * as "already registered" is the honest thing to do — the sign-in screen already
 * reveals existence anyway — and it stops the user waiting for an email that
 * will never come.
 */
export function isExistingEmail(signUpData) {
  const user = signUpData?.user;
  return Boolean(user && Array.isArray(user.identities) && user.identities.length === 0);
}
