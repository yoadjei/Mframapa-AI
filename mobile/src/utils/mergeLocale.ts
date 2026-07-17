/**
 * Merge English catalog, Gemini translations, and optional bundled overrides.
 * Bundled values only win when they differ from English (avoids partial bundles blocking Gemini).
 */
export function mergeLocaleStrings(
  en: Record<string, string>,
  translated: Record<string, string>,
  bundled: Record<string, string> = {}
): Record<string, string> {
  const merged = { ...en, ...translated };
  for (const [key, value] of Object.entries(bundled)) {
    if (value && value !== en[key]) {
      merged[key] = value;
    }
  }
  return merged;
}
