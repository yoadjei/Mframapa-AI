
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
}

export const isGeminiConfigured = () => !!API_KEY;

// Base English Strings
export const baseStrings = {
    // App General
    "app.title": "Mframapa AI",
    "app.tagline": "Real-time AI Air Quality Monitoring for Africa",

    // Hero Section
    "hero.headline_part1": "Breathe Informed.",
    "hero.headline_part2": "Anywhere in Africa.",
    "hero.subheadline_prefix": "AI-powered air quality predictions for",
    "hero.subheadline_highlight": "African nations",
    "hero.subheadline_suffix": ". No sensors required.",
    "hero.cta": "Explore the Map",

    // Navigation & Actions
    "nav.monitoring": "Map",
    "nav.about": "About",
    "nav.report": "Report",
    "btn.start": "Start Monitoring",
    "btn.reset": "Reset View",
    "search.placeholder": "Search African cities...",
    "search.locate": "Use my location",

    // Errors
    "error.geolocation_unsupported": "Geolocation is not supported by your browser",
    "error.location_retrieval": "Unable to retrieve your location",
    "error.outside_africa": "Sorry, Mframapa AI only covers African nations.",
    "error.city_not_found": "City not found or outside coverage.",
    "error.generic": "Could not locate city. Please try again.",
    "error.land_mass": "Location not found. Please click on a land mass.",

    // Prediction Card
    "card.checking": "Checking air quality in",
    "card.pm25_label": "PM2.5",
    "card.unit": "µg/m³",
    "card.satellite_derived": "Satellite Derived",
    "card.updated_now": "Updated just now",
    "card.share": "Share",
    "card.details": "Vivid Details",
    "card.insight_title": "AI Insight",

    // Weather Labels
    "weather.humidity": "Humidity",
    "weather.temp": "Temp",
    "weather.pressure": "Pressure",
    "weather.wind": "Wind",

    // AQI Categories
    "aqi.good": "Good",
    "aqi.moderate": "Moderate",
    "aqi.sensitive": "Unhealthy for Sensitive Groups",
    "aqi.unhealthy": "Unhealthy",
    "aqi.hazardous": "Hazardous",

    // Advice (Generic fallbacks if dynamic generation fails)
    "advice.good": "Air quality is good. Enjoy outdoor activities!",
    "advice.moderate": "Moderate quality. Sensitive individuals should limit prolonged exposure.",
    "advice.sensitive": "Unhealthy for sensitive groups. Wear a mask if needed.",
    "advice.unhealthy": "Air quality is degraded. Reduce outdoor activity.",

    // Share Menu
    "share.whatsapp": "WhatsApp",
    "share.twitter": "X (Twitter)",
    "share.linkedin": "LinkedIn",
    "share.copy": "Copy Link",
    "share.copied": "Link Copied!",

    // About Modal
    "about.title": "About Mframapa AI",
    "about.tab.overview": "Overview",
    "about.tab.how_it_works": "How It Works",
    "about.tab.limitations": "Limitations",
    "about.tab.who_its_for": "Who It's For",

    "about.overview.what_we_do": "What We Do",
    "about.overview.desc": "Mframapa AI estimates daily PM2.5 concentrations across all 54 African nations and translates them into color-coded AQI categories. Predictions update daily as new satellite data becomes available.",
    "about.overview.problem": "The Problem",
    "about.overview.problem_desc": "Most African cities lack public air quality monitors. Mframapa AI provides air quality estimates for unmonitored regions.",

    "about.how.intro": "Leveraging satellite data and machine learning to infer air quality without ground sensors.",
    "about.how.step1.title": "Satellites as Sensors",
    "about.how.step1.desc": "We use ESA Sentinel-5P (NO₂) and NASA MERRA-2 (aerosol) to observe atmospheric conditions daily.",
    "about.how.step2.title": "Ground Calibration",
    "about.how.step2.desc": "The model learns from 425 physical monitoring stations across 29 African countries.",
    "about.how.step3.title": "Continental Inference",
    "about.how.step3.desc": "An XGBoost model translates satellite observations into ground-level PM2.5 estimates for any location.",

    "about.limit.intro": "While powerful, satellite-based estimation has constraints you should be aware of.",
    "about.limit.cloud": "Cloud Blindness",
    "about.limit.cloud_desc": "Satellites cannot measure through thick clouds.",
    "about.limit.gap": "Temporal Gaps",
    "about.limit.gap_desc": "One daily satellite pass may miss short pollution spikes.",
    "about.limit.legal": "Not for Medical/Legal Use",
    "about.limit.legal_desc": "Estimates are not certified measurements.",

    "about.who.citizens": "Citizens",
    "about.who.citizens_desc": "Checking air quality before outdoor activities.",
    "about.who.researchers": "Researchers",
    "about.who.researchers_desc": "Identifying pollution patterns.",
    "about.who.advocacy": "Advocacy Groups",
    "about.who.advocacy_desc": "Building evidence for policy.",

    // Report Modal
    "report.title": "Report Air Quality",
    "report.subtitle": "Contribute to the community data layer.",
    "report.success_title": "Report Sent!",
    "report.success_desc": "Thank you for contributing to Mframapa AI.",
    "report.location_mock": "Using inferred location from map center",
    "report.label_feel": "How does the air feel?",
    "report.label_obs": "Observations (Optional)",
    "report.placeholder_obs": "e.g. Smell of smoke, visible haze...",
    "report.submit": "Submit Report",

    "report.clue.good": "Air feels fresh. No visible haze. Visibility is clear.",
    "report.clue.moderate": "Air is acceptable. Very faint haze might be visible on distant horizons.",
    "report.clue.unhealthy": "Visible smog/smoke. Slight irritation in throat/eyes or distinct odor.",
    "report.clue.hazardous": "Heavy smoke/dust. Poor visibility. Breathing feels difficult or heavy.",

    // Data Panel (Footer)
    "footer.satellite_feed": "Satellite Feed",
    "footer.active": "Active",
    "footer.ground_truth": "Ground Truth",
    "footer.reference_nations": "Reference Nations",
    "footer.inference": "Today's Inference",
    "footer.val": "Val."
};

// Supported Languages and Countries Map
export const SUPPORTED_LANGUAGES = {
    'ar': 'Arabic',
    'fr': 'French',
    'pt': 'Portuguese',
    'en': 'English',
    'tn': 'Tswana',
    'rn': 'Kirundi',
    'es': 'Spanish',
    'ti': 'Tigrinya',
    'ss': 'Swati',
    'am': 'Amharic',
    'tw': 'Twi',
    'sw': 'Swahili',
    'st': 'Sotho',
    'mg': 'Malagasy',
    'ny': 'Chichewa',
    'ha': 'Hausa',
    'yo': 'Yoruba',
    'ig': 'Igbo',
    'rw': 'Kinyarwanda',
    'wo': 'Wolof',
    'so': 'Somali',
    'zu': 'Zulu',
    'xh': 'Xhosa',
    'af': 'Afrikaans',
    'sn': 'Shona',
    'nd': 'Ndebele',
    'ga': 'Ga'
};

const cachedTranslations = {};

/**
 * Translates the entire UI Dictionary to the target language using Gemini.
 */
export const translateUI = async (targetLangCode) => {
    if (targetLangCode === 'en' || !SUPPORTED_LANGUAGES[targetLangCode]) {
        return baseStrings;
    }

    if (cachedTranslations[targetLangCode]) {
        return cachedTranslations[targetLangCode];
    }

    if (!model) {
        console.warn("Gemini API Key missing. Falling back to English.");
        return baseStrings;
    }

    const languageName = SUPPORTED_LANGUAGES[targetLangCode];

    const prompt = `
    You are a professional translator for a Weather/Air Quality App.
    Translate the following JSON object values into ${languageName} (${targetLangCode}).
    Keep the keys exactly the same. Return ONLY the JSON object.
    Do not add markdown formatting like \`\`\`json.
    
    JSON to translate:
    ${JSON.stringify(baseStrings)}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const translations = JSON.parse(text);
        cachedTranslations[targetLangCode] = translations;
        return translations;
    } catch (error) {
        console.error("Translation failed:", error);
        return baseStrings; // Fallback
    }
};

/**
 * Generates specific Air Quality advice in the target language.
 */
export const generateInsight = async (pm25, weather, targetLangCode, locationName) => {
    if (!model) return "High particulate stability observed. Suggests local combustion sources.";

    const languageName = SUPPORTED_LANGUAGES[targetLangCode] || 'English';

    const prompt = `
    Generate a short, helpful, one-sentence insight about the air quality in ${locationName} based on:
    - PM2.5 Level: ${pm25} µg/m³
    - Weather: ${JSON.stringify(weather)}
    
    The insight should be in ${languageName}.
    It should explain scientific reasons briefly (like wind dispersion or stagnation) or give direct health advice.
    Keep it under 20 words.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error("Insight generation failed:", error);
        return "High particulate stability observed.";
    }
};
