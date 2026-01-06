# Mframapa AI: Frontend Localization Scaffold

## Overview
Auto-detect user's device language → Render entire UI + AQI advice in that language.

---

## African Countries → Primary Languages

| Country | ISO Code | Primary Language(s) | i18n Code |
|---|---|---|---|
| Algeria | DZ | Arabic, French | `ar`, `fr` |
| Angola | AO | Portuguese | `pt` |
| Benin | BJ | French | `fr` |
| Botswana | BW | English, Tswana | `en`, `tn` |
| Burkina Faso | BF | French | `fr` |
| Burundi | BI | French, Kirundi | `fr`, `rn` |
| Cameroon | CM | French, English | `fr`, `en` |
| Cape Verde | CV | Portuguese | `pt` |
| Central African Republic | CF | French | `fr` |
| Chad | TD | French, Arabic | `fr`, `ar` |
| Comoros | KM | French, Arabic | `fr`, `ar` |
| Congo (DRC) | CD | French | `fr` |
| Congo (Republic) | CG | French | `fr` |
| Côte d'Ivoire | CI | French | `fr` |
| Djibouti | DJ | French, Arabic | `fr`, `ar` |
| Egypt | EG | Arabic | `ar` |
| Equatorial Guinea | GQ | Spanish, French | `es`, `fr` |
| Eritrea | ER | Tigrinya, Arabic | `ti`, `ar` |
| Eswatini | SZ | English, Swati | `en`, `ss` |
| Ethiopia | ET | Amharic | `am` |
| Gabon | GA | French | `fr` |
| Gambia | GM | English | `en` |
| Ghana | GH | English, Twi | `en`, `tw` |
| Guinea | GN | French | `fr` |
| Guinea-Bissau | GW | Portuguese | `pt` |
| Kenya | KE | English, Swahili | `en`, `sw` |
| Lesotho | LS | English, Sotho | `en`, `st` |
| Liberia | LR | English | `en` |
| Libya | LY | Arabic | `ar` |
| Madagascar | MG | French, Malagasy | `fr`, `mg` |
| Malawi | MW | English, Chichewa | `en`, `ny` |
| Mali | ML | French | `fr` |
| Mauritania | MR | Arabic, French | `ar`, `fr` |
| Mauritius | MU | English, French | `en`, `fr` |
| Morocco | MA | Arabic, French | `ar`, `fr` |
| Mozambique | MZ | Portuguese | `pt` |
| Namibia | NA | English | `en` |
| Niger | NE | French, Hausa | `fr`, `ha` |
| Nigeria | NG | English, Hausa, Yoruba, Igbo | `en`, `ha`, `yo`, `ig` |
| Rwanda | RW | French, English, Kinyarwanda | `fr`, `en`, `rw` |
| São Tomé and Príncipe | ST | Portuguese | `pt` |
| Senegal | SN | French, Wolof | `fr`, `wo` |
| Seychelles | SC | English, French | `en`, `fr` |
| Sierra Leone | SL | English | `en` |
| Somalia | SO | Somali, Arabic | `so`, `ar` |
| South Africa | ZA | English, Zulu, Xhosa, Afrikaans | `en`, `zu`, `xh`, `af` |
| South Sudan | SS | English, Arabic | `en`, `ar` |
| Sudan | SD | Arabic | `ar` |
| Tanzania | TZ | Swahili, English | `sw`, `en` |
| Togo | TG | French | `fr` |
| Tunisia | TN | Arabic, French | `ar`, `fr` |
| Uganda | UG | English, Swahili | `en`, `sw` |
| Zambia | ZM | English | `en` |
| Zimbabwe | ZW | English, Shona, Ndebele | `en`, `sn`, `nd` |

---

## Priority Languages for MVP

Focus on these 10 languages (covers ~90% of African users):

| Language | Code | Coverage |
|---|---|---|
| English | `en` | 20+ countries |
| French | `fr` | 26 countries |
| Arabic | `ar` | 12 countries |
| Portuguese | `pt` | 6 countries |
| Swahili | `sw` | 5+ countries (100M+ speakers) |
| Hausa | `ha` | Nigeria, Niger (70M+ speakers) |
| Amharic | `am` | Ethiopia (30M+ speakers) |
| Yoruba | `yo` | Nigeria (45M speakers) |
| Zulu | `zu` | South Africa (12M speakers) |
| Twi | `tw` | Ghana (10M+ speakers) |

---

## Architecture: Where Gemini API Fits

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Detect browser language: navigator.language → "fr"          │
│  2. Load static UI strings from i18n JSON files                 │
│  3. When showing AQI prediction → Call /api/translate-advice    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (FastAPI)                       │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/translate-advice                                     │
│  Body: { pm25: 85, aqi_category: "Unhealthy", language: "fr" }  │
│                                                                 │
│  → Calls Gemini 3 API with prompt:                              │
│    "Translate this AQI advice into French. Make it culturally  │
│     appropriate and actionable. Do not use technical jargon.   │
│     PM2.5 is 85. Air quality is Unhealthy."                    │
│                                                                 │
│  ← Returns: { advice: "La qualité de l'air est mauvaise..." }  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Implementation Steps

### Step 1: Install i18n
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### Step 2: Create translation files
```
frontend/src/locales/
├── en/translation.json
├── fr/translation.json
├── ar/translation.json
├── sw/translation.json
├── ha/translation.json
└── ... (other languages)
```

### Step 3: Example translation file (fr/translation.json)
```json
{
  "app_name": "Mframapa AI",
  "search_placeholder": "Rechercher une ville...",
  "search_button": "Rechercher",
  "aqi_good": "Bonne qualité de l'air",
  "aqi_moderate": "Qualité modérée",
  "aqi_unhealthy": "Mauvaise qualité"
}
```

### Step 4: i18n config (src/i18n.js)
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import fr from './locales/fr/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, fr: { translation: fr } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });

export default i18n;
```

### Step 5: Use in components
```jsx
import { useTranslation } from 'react-i18next';

function SearchBar() {
  const { t } = useTranslation();
  return <input placeholder={t('search_placeholder')} />;
}
```

---

## Gemini API Integration (Backend)

### Endpoint: POST /api/translate-advice

```python
from fastapi import FastAPI
import google.generativeai as genai

genai.configure(api_key="YOUR_GEMINI_API_KEY")

@app.post("/api/translate-advice")
async def translate_advice(pm25: float, aqi_category: str, language: str):
    prompt = f"""
    You are a public health advisor in Africa. Translate this air quality information 
    into {language}. Make it:
    - Culturally appropriate with local idioms
    - Actionable (tell people what to do)
    - Simple (no technical jargon)
    - Warm and caring in tone
    
    Data:
    - PM2.5: {pm25} μg/m³
    - Category: {aqi_category}
    
    Respond ONLY with the translated advice, nothing else.
    """
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    response = model.generate_content(prompt)
    
    return {"advice": response.text}
```

---

## Summary for Frontend Dev

| Component | Technology | Notes |
|---|---|---|
| Language detection | `i18next-browser-languagedetector` | Automatic |
| Static UI strings | JSON files per language | Menu labels, buttons, tooltips |
| Dynamic AQI advice | Gemini API via `/api/translate-advice` | Real-time translation |
| RTL support | CSS `direction: rtl` | For Arabic |

---

language should be switchable manually
arabic reads from right to left
