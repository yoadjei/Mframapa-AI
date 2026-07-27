/**
 * Clean "What to do" / guidance copy for display.
 * Drops em/en dashes, bare hyphens used as separators, semicolons, and colons
 * so health lines stay plain sentences across clients.
 */
export function cleanGuidanceText(text) {
  if (text == null) return "";
  return String(text)
    .replace(/\u2014|\u2013|—|–/g, " ")
    .replace(/\s*[-–—]\s*/g, " ")
    .replace(/[;:]/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}
