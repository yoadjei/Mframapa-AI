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
  const isBullet = (l) => l.trim().startsWith("•");
  const list = (lines) =>
    "<ul>" + lines.map((l) => `<li>${esc(l.trim().replace(/^•\s*/, ""))}</li>`).join("") + "</ul>";

  const blocks = body.split(/\n\s*\n/);
  const out = [];
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;

    if (lines.every(isBullet)) {
      out.push(list(lines));
    } else if (lines.length === 1) {
      out.push(`<p>${esc(lines[0])}</p>`);
    } else if (lines.slice(1).every(isBullet)) {
      // a heading followed by bullets. the old every() check failed on the
      // heading line, so the block collapsed into one run-on paragraph with
      // the bullet characters left inline.
      out.push(`<h2>${esc(lines[0])}</h2>${list(lines.slice(1))}`);
    } else {
      const rest = lines.slice(1);
      const bullets = rest.filter(isBullet);
      const prose = rest.filter((l) => !isBullet(l));
      out.push(`<h2>${esc(lines[0])}</h2>`);
      if (prose.length) out.push(`<p>${esc(prose.join(" "))}</p>`);
      if (bullets.length) out.push(list(bullets));
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
<title>${esc(section.title)} | Mframapa</title>
<meta name="robots" content="index,follow" />
<script>
  // follow whatever theme the app is set to, so these do not read as a
  // different product when someone taps through from settings.
  (function () {
    var mode = "system";
    try {
      var saved = JSON.parse(localStorage.getItem("mframapa:v2:pwa-state") || "{}");
      mode = (saved.preferences && saved.preferences.theme) || "system";
    } catch (e) { /* first visit, or storage blocked */ }
    var dark = mode === "dark" ||
      (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  })();
</script>
<style>
  :root {
    --bg: #FFFFFF; --text: #0F1419; --muted: #5C6B7A;
    --dim: #7B8A99; --line: #D4DAE3; --accent: #00A47C;
    color-scheme: light;
  }
  html[data-theme="dark"] {
    --bg: #0A0D12; --text: #FFFFFF; --muted: #9AA7B5;
    --dim: #647182; --line: #25303C; --accent: #00C896;
    color-scheme: dark;
  }
  body {
    max-width: 720px; margin: 0 auto; padding: 32px 20px 64px;
    font: 16px/1.65 system-ui, -apple-system, "Segoe UI", sans-serif;
    color: var(--text); background: var(--bg);
    -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%;
  }
  h1 { font-size: 26px; margin: 0 0 4px; color: var(--text); }
  h2 { font-size: 17px; margin: 30px 0 8px; color: var(--text); }
  p, li { color: var(--muted); }
  ul { padding-left: 20px; margin: 8px 0; }
  li { margin-bottom: 8px; }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .updated { color: var(--dim); font-size: 13px; margin-bottom: 28px; }
  nav {
    margin-top: 44px; padding-top: 20px; font-size: 14px;
    border-top: 1px solid var(--line);
  }
</style>
</head>
<body>
  <h1>${esc(section.title)}</h1>
  <p class="updated">Mframapa · Last updated ${updated}</p>
  ${bodyToHtml(section.body)}
  <nav><a href="/privacy.html">Privacy Policy</a> · <a href="/terms.html">Terms of Service</a> · <a href="/licenses.html">Licenses</a> · <a href="/">Back to app</a></nav>
</body>
</html>
`;
}

const updated = new Date().toISOString().slice(0, 10);
const outDir = resolve(root, "public");
mkdirSync(outDir, { recursive: true });
for (const id of ["privacy", "terms", "licenses"]) {
  const section = LEGAL_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`legal section '${id}' not found`);
  writeFileSync(resolve(outDir, `${id}.html`), page(section, updated));
  console.log(`generated public/${id}.html`);
}
