/**
 * In-memory only (resets when the app process restarts).
 * After sign-out in the same session, skip intro slides and show login.
 * On cold start, always show the full intro when not signed in.
 */
let skipIntroThisSession = false;

export function markSignOutThisSession(): void {
  skipIntroThisSession = true;
}

export function shouldStartOnboardingAtAuth(): boolean {
  return skipIntroThisSession;
}

export function clearSignOutSession(): void {
  skipIntroThisSession = false;
}
