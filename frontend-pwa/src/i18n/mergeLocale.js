/**
 * Merge English catalog, Gemini translations, and optional bundled overrides.
 * Bundled values only win when they differ from English (avoids partial bundles blocking Gemini).
 */
export function mergeLocaleStrings(en, translated, bundled = {}) {
  const merged = { ...en, ...translated };
  for (const [key, value] of Object.entries(bundled)) {
    if (value && value !== en[key]) {
      merged[key] = value;
    }
  }
  return merged;
}
