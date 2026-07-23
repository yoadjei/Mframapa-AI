/**
 * Input guardrails for the auth forms.
 *
 * The point is to catch mistakes before a round trip, not to be clever: an
 * address that fails here is definitely wrong, and one that passes still has to
 * survive the confirmation email. Over-strict email regexes reject valid
 * addresses (plus-tags, long TLDs, non-ascii domains), so this checks structure
 * only: something, an @, a domain with a dot, and a plausible TLD.
 */

const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(value) {
  const email = String(value ?? "").trim();
  if (email.length < 5 || email.length > 254) return false;
  if (!EMAIL.test(email)) return false;
  // a trailing tld of one character is always a typo (".c", ".n")
  const tld = email.split(".").pop();
  return tld.length >= 2;
}

/** null when fine, otherwise a translation key describing what is wrong. */
export function passwordProblem(value) {
  const password = String(value ?? "");
  if (password.length < MIN_PASSWORD_LENGTH) return "auth.error.password_short";
  // a password that is only one character repeated, or purely sequential, is
  // weak enough to be worth blocking outright.
  if (/^(.)\1+$/.test(password)) return "auth.error.password_weak";
  return null;
}

/** rough strength for the meter: 0 none, 1 weak, 2 fair, 3 strong. */
export function passwordStrength(value) {
  const password = String(value ?? "");
  if (!password) return 0;
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(3, Math.max(1, score - 1));
}
