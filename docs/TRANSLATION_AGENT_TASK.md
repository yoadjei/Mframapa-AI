# Translation task for the Antigravity agent

Paste everything under the line into the Antigravity agent. A strong model
(Claude Opus 4.6 or Gemini 3 Pro) will do this well. It translates the small
`_todo` files in place; our scripts handle the rest.

Before you run the agent:

```bash
cd "c:/Users/adjei/Downloads/projects/Mframapa AI"
venv/Scripts/python -m ml.scripts.export_missing
```

That writes `frontend-pwa/src/locales/_todo/<lang>.json` for every language.

After the agent finishes:

```bash
venv/Scripts/python -m ml.scripts.merge_translations
cd frontend-pwa && npm run build        # sanity check the bundles
```

---

You are localising the interface of **Mframapa**, an air quality app used across
Africa by ordinary people, many on small phones and many reading in their second
or third language.

## Task

In the folder `frontend-pwa/src/locales/_todo/` there is one JSON file per
language, named by its code (`fr.json` is French, `sw.json` is Swahili,
`tw.json` is Twi, and so on). Each file maps a key to an **English** string.

For every file, **translate each value into the language named by the file**, and
**write the translated value back in place**, keeping the same keys. Do not
create, delete, reorder or rename keys. Do not touch `en.json` or any file
outside `_todo/`.

The language codes are:
af Afrikaans, am Amharic, ar Arabic, ee Ewe, es Spanish, fr French, ga Ga,
ha Hausa, ig Igbo, mg Malagasy, nd Ndebele, ny Chichewa, pt Portuguese,
rn Kirundi, rw Kinyarwanda, sn Shona, so Somali, ss Swati, st Sotho,
sw Swahili, ti Tigrinya, tn Tswana, tw Twi, wo Wolof, xh Xhosa, yo Yoruba,
zu Zulu.

## How to translate

**Meaning first.** Translate what the sentence *does*, not word by word. If a
literal rendering would read stiff, foreign or comic, rewrite it the way a fluent
speaker actually says it. Everyday, respectful register, not academic and not
slangy. Keep it short: these are buttons, labels and one line cards on a small
screen. Health guidance must stay accurate and actionable, a caregiver has to
know immediately what to do; never soften a warning, never strengthen one, never
invent a detail.

**Capitalisation.** Follow the conventions of the target language itself, not
English habits. English UI often title cases ("Saved Locations"); most languages
do not, so use the casing a native reader expects, usually sentence case with a
capital on the first word only. If the language has no letter case, ignore casing
entirely. Preserve capitalisation that carries meaning: proper nouns, place
names, acronyms. If the English is ALL CAPS for emphasis, do not copy that; use
normal casing.

**Punctuation and numbers.** Use the target language's own punctuation and
quotation marks. Never use em dashes or en dashes; use a comma or a full stop.
Keep numerals as digits; do not turn 17 into a word.

**Never translate, keep exactly as written:**
- Placeholders in double braces: `{{name}}`, `{{pm25}}`, `{{category}}`,
  `{{city}}`, `{{count}}`, `{{low}}`, `{{high}}`. Keep the braces and spelling.
- The product name **Mframapa**.
- Units and technical tokens: PM2.5, PM10, AQI, NO2, SO2, CO, µg/m³.

**Forbidden:**
- Do not keep the English alongside the translation.
- Do not add a gloss, transliteration, explanation or note in brackets.
  "Lite mode (mapu achepetsedwa)" is wrong; "mapu achepetsedwa" is right.
- Do not add quotation marks that were not in the English.
- Do not return commentary. Only edit the JSON files.

**When a term has no local equivalent**, use the widely understood loanword
rather than inventing a new one, and do not mark it in any way.

## Output

Edit each `_todo/*.json` in place: same keys, translated values, valid JSON,
UTF-8. Work through every language file in the folder.
