import * as Sentry from '@sentry/react-native';

/**
 * Initialise crash reporting. The DSN comes from EXPO_PUBLIC_SENTRY_DSN so it can
 * differ per build; a Sentry DSN is safe to ship in client code (it only allows
 * sending events, not reading them).
 *
 * Privacy-first: no PII, so a stray coordinate or email never leaves the device
 * in a crash report. `global.Sentry` is set so the plain error boundary can
 * report without importing the SDK.
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    Sentry.init({
      dsn,
      sendDefaultPii: false,
      tracesSampleRate: 0.1,
      // native crash handling only works in a real build, not Expo Go; harmless there
      enableNativeCrashHandling: true,
    });
    // @ts-expect-error attach for the dependency-free error boundary
    global.Sentry = Sentry;
  } catch {
    // Expo Go without the native module, or a bad dsn: never block startup
  }
}
