// Fill missing locale keys by translating them once, at build time.
//
// The app can translate at runtime through /translate, but the full catalog is
// ~730 keys, which chunks into roughly twenty Gemini calls and often times out
// on a slow connection. That left every bundled language at ~54% coverage and
// the rest showing English. Translating here instead means the shipped bundles
// are complete, the app needs no network to be fully localized, and runtime
// translation is only ever needed for keys added after a release.
//
//   node scripts/fill-locales.mjs            # fill everything missing
//   node scripts/fill-locales.mjs fr sw tw   # only these languages
//
// Needs the API to be reachable (it holds the Gemini key; we never ship one).

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const localesDir = resolve(here, "../src/locales");
const API = process.env.MFRAMAPA_API_URL || "https://api.mframapa.live";
const CHUNK = 30;          // matches the server's own chunking comfortably
const PAUSE_MS = 400;      // stay polite to the upstream quota

const LANGUAGE_NAMES = {
  af: "Afrikaans", am: "Amharic", ar: "Arabic", ee: "Ewe", es: "Spanish",
  fr: "French", ga: "Ga", ha: "Hausa", ig: "Igbo", mg: "Malagasy",
  nd: "Ndebele", ny: "Chichewa", pt: "Portuguese", rn: "Kirundi",
  rw: "Kinyarwanda", sn: "Shona", so: "Somali", ss: "Swati", st: "Sotho",
  sw: "Swahili", ti: "Tigrinya", tn: "Tswana", tw: "Twi", wo: "Wolof",
  xh: "Xhosa", yo: "Yoruba", zu: "Zulu",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function translateChunk(strings, lang) {
  const res = await fetch(`${API}/api/v1/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strings,
      target_language: lang,
      target_language_name: LANGUAGE_NAMES[lang] ?? lang,
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const data = await res.json();
  if (data.fallback) throw new Error("provider unavailable (served english)");
  return data.translations ?? {};
}

const en = JSON.parse(readFileSync(resolve(localesDir, "en.json"), "utf8"));
const only = process.argv.slice(2);
const langs = readdirSync(localesDir)
  .filter((f) => f.endsWith(".json") && f !== "en.json")
  .map((f) => f.replace(".json", ""))
  .filter((l) => (only.length ? only.includes(l) : true));

let totalAdded = 0;

for (const lang of langs) {
  const path = resolve(localesDir, `${lang}.json`);
  const current = JSON.parse(readFileSync(path, "utf8"));
  const missing = Object.keys(en).filter((k) => !(k in current));
  if (!missing.length) {
    console.log(`${lang}: complete`);
    continue;
  }

  process.stdout.write(`${lang}: ${missing.length} missing `);
  let added = 0;

  for (let i = 0; i < missing.length; i += CHUNK) {
    const keys = missing.slice(i, i + CHUNK);
    const payload = Object.fromEntries(keys.map((k) => [k, en[k]]));
    try {
      const out = await translateChunk(payload, lang);
      for (const k of keys) {
        // never write back the english string as if it were a translation
        if (out[k] && out[k] !== en[k]) {
          current[k] = out[k];
          added += 1;
        }
      }
      process.stdout.write(".");
    } catch (err) {
      process.stdout.write("x");
    }
    await sleep(PAUSE_MS);
  }

  writeFileSync(path, JSON.stringify(current, null, 2) + "\n", "utf8");
  totalAdded += added;
  const cov = ((Object.keys(current).length / Object.keys(en).length) * 100).toFixed(1);
  console.log(` +${added} -> ${cov}%`);
}

console.log(`\ndone: ${totalAdded} strings translated`);
