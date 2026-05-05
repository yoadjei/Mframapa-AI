/**
 * Mframapa AI API Service
 * Connects frontend to backend with caching strategies
 */

import axios from 'axios';

// API Base URL - empty string uses Vite proxy in dev, set VITE_API_URL in production
const API_BASE = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'mframapa-internal-dev-key'
    }
});

// =============================================================================
// CACHING
// =============================================================================

// Prediction cache (keyed by lat_lon rounded to 3 decimals)
const predictionCache = new Map();
const PREDICTION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Translation cache (persisted to localStorage)
const TRANSLATION_STORAGE_KEY = 'mframapa_translations';

const getTranslationCache = () => {
    try {
        const cached = localStorage.getItem(TRANSLATION_STORAGE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
};

const setTranslationCache = (lang, translations) => {
    try {
        const cache = getTranslationCache();
        cache[lang] = {
            data: translations,
            timestamp: Date.now()
        };
        localStorage.setItem(TRANSLATION_STORAGE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.warn('Translation cache save failed', e);
    }
};

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Resolve location name to coordinates (Africa only)
 */
export const resolveLocation = async (city) => {
    try {
        const response = await api.get('/api/v1/resolve-location', {
            params: { city }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Location not found');
    }
};

/**
 * Get air quality prediction with caching
 */
export const getPrediction = async (lat, lon, name = 'Unknown') => {
    // Create cache key (rounded to 3 decimal places)
    const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;

    // Check cache
    const cached = predictionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < PREDICTION_CACHE_TTL) {
        console.log('Using cached prediction for', cacheKey);
        return cached.data;
    }

    try {
        const response = await api.get('/api/v1/predict', {
            params: { lat, lon, name }
        });

        // Store in cache
        predictionCache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });

        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Prediction failed');
    }
};

/**
 * Generate AI insight with backend
 */
export const generateInsight = async (pm25, aqiCategory, weather, language = 'en') => {
    try {
        const response = await api.post('/api/v1/generate-insight', {
            pm25,
            aqi_category: aqiCategory,
            weather,
            language
        });
        return response.data.insight;
    } catch (error) {
        console.warn('Insight generation failed', error);
        return null; // Return null to fall back to default
    }
};

/**
 * Translate UI strings with caching
 */
export const translateUI = async (strings, targetLanguage) => {
    if (targetLanguage === 'en') {
        return strings;
    }

    // Check localStorage cache
    const cache = getTranslationCache();
    if (cache[targetLanguage]) {
        const cacheAge = Date.now() - cache[targetLanguage].timestamp;
        const ONE_DAY = 24 * 60 * 60 * 1000;

        if (cacheAge < ONE_DAY) {
            console.log('Using cached translations for', targetLanguage);
            return cache[targetLanguage].data;
        }
    }

    try {
        const response = await api.post('/api/v1/translate-ui', {
            strings,
            target_language: targetLanguage
        });

        const translations = response.data.translations;
        setTranslationCache(targetLanguage, translations);

        return translations;
    } catch (error) {
        console.warn('Translation failed, using English', error);
        return strings;
    }
};

/**
 * Submit crowd-sourced report
 */
export const submitReport = async (lat, lon, perceivedQuality, comment = null) => {
    try {
        const response = await api.post('/api/v1/report', {
            lat,
            lon,
            perceived_quality: perceivedQuality,
            comment
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Report submission failed');
    }
};

/**
 * Check backend health
 */
export const checkHealth = async () => {
    try {
        const response = await api.get('/api/v1/health');
        return response.data;
    } catch (error) {
        return {
            status: 'offline',
            model_loaded: false,
            satellite_api: 'error',
            weather_api: 'error',
            gemini_api: 'error'
        };
    }
};

/**
 * Get supported languages
 */
export const getSupportedLanguages = async () => {
    try {
        const response = await api.get('/api/v1/languages');
        return response.data.languages;
    } catch {
        // Fallback languages
        return {
            'en': 'English',
            'fr': 'French',
            'ar': 'Arabic',
            'sw': 'Swahili'
        };
    }
};

// =============================================================================
// CACHE UTILITIES
// =============================================================================

/**
 * Clear all caches
 */
export const clearCache = () => {
    predictionCache.clear();
    localStorage.removeItem(TRANSLATION_STORAGE_KEY);
    console.log('All caches cleared');
};

/**
 * Get cache stats
 */
export const getCacheStats = () => {
    return {
        predictions: predictionCache.size,
        translations: Object.keys(getTranslationCache()).length
    };
};

export default api;
