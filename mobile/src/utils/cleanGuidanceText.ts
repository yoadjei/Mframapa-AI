/**
 * Clean "What to do" / guidance copy for display.
 * Drops em/en dashes, separator hyphens, semicolons, and colons.
 */
export function cleanGuidanceText(text: unknown): string {
  if (text == null) return '';
  return String(text)
    .replace(/\u2014|\u2013|—|–/g, ' ')
    .replace(/\s*[-–—]\s*/g, ' ')
    .replace(/[;:]/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .trim();
}
