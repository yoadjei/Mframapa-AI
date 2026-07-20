// generates standalone /privacy.html and /terms.html from the single source in
// src/content/legal.js, so store reviewers and crawlers get plain html (no spa/js)
// and the pages can never drift from what the app shows. run before build.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const { LEGAL_SECTIONS } = await import(pathToFileURL(resolve(root, "src/content/legal.js")));

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// body is plain text with blank-line-separated blocks; bullets start with "•".
function bodyToHtml(body) {
  const blocks = body.split(/\n\s*\n/);
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    if (lines.every((l) => l.trim().startsWith("•"))) {
      out.push("<ul>" + lines.map((l) => `<li>${esc(l.replace(/^•\s*/, ""))}</li>`).join("") + "</ul>");
    } else if (lines.length === 1) {
      out.push(`<p>${esc(lines[0])}</p>`);
    } else {
      // first line acts as a subheading, rest as a paragraph
      out.push(`<h2>${esc(lines[0])}</h2><p>${esc(lines.slice(1).join(" "))}</p>`);
    }
  }
  return out.join("\n");
}

function page(section, updated) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(section.title)} — Mframapa</title>
<meta name="robots" content="index,follow" />
<style>
  body { max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; font: 16px/1.6 system-ui, sans-serif; color: #0f172a; background: #fff; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 28px 0 6px; }
  p, li { color: #334155; }
  a { color: #0f766e; }
  .updated { color: #64748b; font-size: 13px; margin-bottom: 24px; }
  nav { margin-top: 40px; font-size: 14px; }
</style>
</head>
<body>
  <h1>${esc(section.title)}</h1>
  <p class="updated">Mframapa · Last updated ${updated}</p>
  ${bodyToHtml(section.body)}
  <nav><a href="/privacy.html">Privacy Policy</a> · <a href="/terms.html">Terms of Service</a> · <a href="/">Back to app</a></nav>
</body>
</html>
`;
}

const updated = new Date().toISOString().slice(0, 10);
const outDir = resolve(root, "public");
mkdirSync(outDir, { recursive: true });
for (const id of ["privacy", "terms"]) {
  const section = LEGAL_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`legal section '${id}' not found`);
  writeFileSync(resolve(outDir, `${id}.html`), page(section, updated));
  console.log(`generated public/${id}.html`);
}
