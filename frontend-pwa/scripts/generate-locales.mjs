/**
 * Fills every bundled locale JSON with the full EN key set via Gemini REST API.
 * Reads GEMINI_API_KEY and GEMINI_MODEL from ../../.env automatically.
 *
 * Usage:  node scripts/generate-locales.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load .env two levels up ───────────────────────────────────────────────
function loadEnv(envPath) {
  try {
    const raw = readFileSync(envPath, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* .env not found, rely on shell env */ }
}
loadEnv(resolve(__dir, "../../.env"));

const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
if (!GEMINI_KEY) { console.error("GEMINI_API_KEY not set"); process.exit(1); }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

// ── Locale config ─────────────────────────────────────────────────────────
const locales = resolve(__dir, "../src/locales");

const LANG_NAMES = {
  af:"Afrikaans", am:"Amharic",    ar:"Arabic",      ee:"Ewe",
  es:"Spanish",   fr:"French",     ga:"Ga",           ha:"Hausa",
  ig:"Igbo",      mg:"Malagasy",   nd:"Ndebele",      ny:"Chichewa",
  pt:"Portuguese",rn:"Kirundi",    rw:"Kinyarwanda",  sn:"Shona",
  so:"Somali",    ss:"Swati",      st:"Sotho",        sw:"Swahili",
  ti:"Tigrinya",  tn:"Tswana",     tw:"Twi",           wo:"Wolof",
  xh:"Xhosa",     yo:"Yoruba",     zu:"Zulu",
};

const en    = JSON.parse(readFileSync(resolve(locales, "en.json"), "utf8"));
const enKeys = Object.keys(en);
const files  = readdirSync(locales).filter(f => f.endsWith(".json") && f !== "en.json");

// ── Gemini call ───────────────────────────────────────────────────────────
async function geminiTranslate(strings, lang, langName) {
  const pairs = Object.entries(strings)
    .map(([k, v]) => `"${k}": ${JSON.stringify(v)}`)
    .join("\n");

  const prompt = `You are a professional translator specialising in African languages and UI localisation.

Translate the following JSON key-value pairs from English to ${langName} (language code: ${lang}).

Rules:
- Return ONLY a valid JSON object with the same keys.
- Keep product names ("Mframapa", "Mframapa AI") untranslated.
- Keep placeholders like {{city}}, {{pm25}}, {{category}}, {{time}} exactly as-is.
- Keep unit strings like "µg/m³" exactly as-is.
- Translate every value; never leave a value in English.
- Output nothing outside the JSON object.

Source strings:
{
${pairs}
}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw Object.assign(new Error("rate_limited"), { code: 429 });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  const raw  = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error("No JSON in Gemini response");
  return JSON.parse(json);
}

// ── Per-file logic ────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fillLocale(lang, existing) {
  const missing = enKeys.filter(k => !existing[k] || existing[k] === en[k]);
  if (missing.length === 0) { console.log(`  ${lang}: already complete ✓`); return existing; }

  console.log(`  ${lang}: translating ${missing.length} missing keys...`);
  const CHUNK = 55;
  const translated = { ...existing };

  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk   = missing.slice(i, i + CHUNK);
    const payload = Object.fromEntries(chunk.map(k => [k, en[k]]));
    const label   = `chunk ${Math.floor(i / CHUNK) + 1}/${Math.ceil(missing.length / CHUNK)}`;

    let attempt = 0;
    while (attempt < 5) {
      attempt++;
      try {
        const result = await geminiTranslate(payload, lang, LANG_NAMES[lang]);
        Object.assign(translated, result);
        process.stdout.write(`    ${label} ✓\n`);
        break;
      } catch (err) {
        const wait = err.code === 429 ? 15000 * attempt : 5000 * attempt;
        console.error(`    ${label} attempt ${attempt} failed: ${err.message} — waiting ${wait / 1000}s`);
        await sleep(wait);
      }
    }

    // Polite delay between chunks (stay under 10 RPM)
    if (i + CHUNK < missing.length) await sleep(6000);
  }

  return translated;
}

// ── Main ──────────────────────────────────────────────────────────────────
(async () => {
  console.log(`Updating ${files.length} locale files (${enKeys.length} keys each) via Gemini ${GEMINI_MODEL}\n`);

  for (const file of files) {
    const lang = file.replace(".json", "");
    if (!LANG_NAMES[lang]) { console.log(`  ${lang}: no mapping, skipping`); continue; }

    const path = resolve(locales, file);
    let existing = {};
    try { existing = JSON.parse(readFileSync(path, "utf8")); } catch { /* new file */ }

    try {
      const complete = await fillLocale(lang, existing);
      // Write in EN key order for clean diffs
      const ordered = Object.fromEntries(enKeys.map(k => [k, complete[k] ?? en[k]]));
      writeFileSync(path, JSON.stringify(ordered, null, 2) + "\n", "utf8");
      console.log(`  ${lang}: saved ✓\n`);
    } catch (err) {
      console.error(`  ${lang}: FAILED — ${err.message}\n`);
    }

    // Brief pause between languages
    await sleep(2000);
  }

  console.log("All done.");
})();
