export const LEGAL_SECTIONS = [
  {
    id: "privacy",
    title: "Privacy Policy",
    body: `Mframapa AI respects your privacy. This policy explains what we collect, why we collect it, and how you can control your data.

What we collect
• Location coordinates when you tap "Check now", search for a city, or interact with the map — used only to fetch air-quality estimates for that point.
• App preferences such as theme, language, and notification settings — stored on your device.
• Anonymous usage events (screen views, prediction requests) if analytics are enabled — never sold to third parties.

What we do not collect
• We do not require an account for basic use.
• We do not access contacts, photos, or messages.
• We do not track you across unrelated apps or websites.

How we use data
Predictions are computed on our servers using satellite and weather inputs. Your coordinates are sent over HTTPS solely to return PM2.5 estimates, uncertainty ranges, and health guidance. We retain server logs for up to 30 days for security and reliability, then aggregate or delete them.

Your choices
• Deny location permission and use city search instead.
• Enable Privacy mode in Settings to limit personal detail in on-screen labels.
• Clear app data from your device settings at any time.

Children
Mframapa is intended for general audiences. We do not knowingly collect personal information from children under 13.

Contact
Questions about privacy: privacy@mframapa.live`,
  },
  {
    id: "terms",
    title: "Terms of Service",
    body: `By using Mframapa AI you agree to these terms. If you do not agree, please uninstall the app.

Service description
Mframapa provides estimated PM2.5 and air-quality categories for locations across Africa, derived from satellite data and machine-learning models. Estimates are informational — not certified measurements for medical, legal, or regulatory decisions.

Acceptable use
• Use the app for personal, educational, research, or advocacy purposes.
• Do not scrape, reverse-engineer, or overload our APIs.
• Do not misrepresent estimates as ground-truth monitor readings.

Accuracy & limitations
Cloud cover, sparse calibration stations, and model uncertainty can affect results. See Credits & Attribution for data sources. We may change models or coverage without notice.

Availability
We strive for high uptime but do not guarantee uninterrupted service. Features may differ between mobile and web versions.

Liability
To the fullest extent permitted by law, Mframapa and its contributors are not liable for health or financial decisions made based on app outputs.

Changes
We may update these terms. Continued use after updates constitutes acceptance.

Governing law
These terms are governed by applicable law in the jurisdiction of the project maintainer unless local consumer law requires otherwise.`,
  },
  {
    id: "licenses",
    title: "Open Source Licenses",
    body: `Mframapa AI is built with open-source and commercial components. Key dependencies include:

Mobile app
• React Native & Expo — MIT License
• React Navigation — MIT License
• Zustand — MIT License
• Axios — MIT License
• react-native-webview — MIT License
• @react-native-community/netinfo — MIT License
• expo-location — Expo / MIT

Maps
• Mapbox GL JS — Mapbox Terms of Service (map tiles and SDK)
• Map data © OpenStreetMap contributors

Backend & ML
• Python, FastAPI — MIT / BSD-style licenses
• XGBoost — Apache License 2.0
• LightGBM — MIT License
• Scientific Python stack (NumPy, pandas, scikit-learn, etc.)

Data sources (see Credits)
Sentinel-5P, ERA5/MERRA-2, MODIS, WorldPop, SRTM, and other geospatial feeds are subject to their respective provider terms (ESA, Copernicus, NASA, etc.).

Full license texts for bundled libraries are available in the project repository under each package's LICENSE file. For Mapbox, see https://www.mapbox.com/legal/tos`,
  },
  {
    id: "contact",
    title: "Contact & Feedback",
    body: `We welcome feedback from citizens, researchers, and organizations working on clean air in Africa.

Report an issue
• In-app: use Report Air Quality from the menu (web) or email support@mframapa.live with your city, date, and what you observed (haze, smoke smell, etc.).
• Bugs: include your device model, Android version, and steps to reproduce.

Feature requests
Tell us which cities, languages, or alerts matter most to your community. We prioritize coverage for underserved regions.

Partnerships
Institutions interested in API access, bulk exports, or collaboration: partners@mframapa.live

Community reports
Optional ground-truth reports help improve future models. Reports are aggregated; do not include personal health records in free-text fields.

Response time
We aim to reply within 5 business days. Critical safety issues are prioritized.`,
  },
  {
    id: "credits",
    title: "Credits & Attribution",
    body: `Mframapa AI — satellite-powered air quality intelligence for Africa.

Overview
We estimate daily PM2.5 concentrations across all 54 African nations where satellite and weather data allow inference.

How it works
1. Satellites as sensors — ESA Sentinel-5P and NASA MERRA-2 (and related reanalysis) provide atmospheric inputs.
2. Ground calibration — Models trained using hundreds of monitoring stations across dozens of countries.
3. Continental inference — Regional XGBoost + LightGBM ensembles predict PM2.5 for urban and rural segments.

Data & methods
• Copernicus ERA5 / Sentinel-5P via Copernicus Data Space
• NASA Earthdata (MODIS and related products)
• Open-Meteo for meteorological fallback
• WorldPop for population density; SRTM for elevation
• OpenStreetMap for road proximity proxies where available

Limitations
• Satellites cannot see through thick clouds ("cloud blindness").
• Daily passes may miss short pollution spikes.
• Estimates are not certified for medical or legal use.

Who it's for
• Citizens planning outdoor activities
• Researchers studying spatial pollution patterns
• Advocacy groups building policy evidence

Made with love for Africa. Version 2.0.0`,
  },
];

export function getLegalSection(id) {
  return LEGAL_SECTIONS.find((s) => s.id === id);
}
