import React, { createContext, useContext, useState, useEffect } from 'react';
import { baseStrings, SUPPORTED_LANGUAGES } from '../services/gemini';

const LanguageContext = createContext();

// pre-cache English strings
const translationCache = {
    en: baseStrings
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        // check localStorage first
        const saved = localStorage.getItem('language');
        if (saved && SUPPORTED_LANGUAGES[saved]) return saved;
        return 'en';
    });
    const [translations, setTranslations] = useState(translationCache[language] || baseStrings);
    const [loading, setLoading] = useState(false);

    // on mount, detect browser language if no saved preference
    useEffect(() => {
        const saved = localStorage.getItem('language');
        if (saved) return; // user already chose a language

        // check URL parameter first
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang && SUPPORTED_LANGUAGES[urlLang]) {
            changeLanguage(urlLang);
            return;
        }

        // detect browser language
        const browserLang = navigator.language.split('-')[0].toLowerCase();
        if (SUPPORTED_LANGUAGES[browserLang] && browserLang !== 'en') {
            changeLanguage(browserLang);
        }
    }, []);

    // expose for testing
    useEffect(() => {
        window.setAppLanguage = changeLanguage;
        return () => delete window.setAppLanguage;
    }, []);

    const changeLanguage = async (langCode) => {
        if (langCode === language) return;

        // save to localStorage for persistence
        localStorage.setItem('language', langCode);
        setLanguageState(langCode);

        // if English, use base strings immediately
        if (langCode === 'en') {
            setTranslations(baseStrings);
            return;
        }

        // check cache first for instant switching
        if (translationCache[langCode]) {
            setTranslations(translationCache[langCode]);
            return;
        }

        // only show loading if we need to fetch
        setLoading(true);
        try {
            // try backend API first (faster, cached)
            const response = await fetch('/api/translate-ui', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    strings: baseStrings,
                    target_language: langCode
                })
            });

            if (response.ok) {
                const translated = await response.json();
                translationCache[langCode] = translated;
                setTranslations(translated);
            } else {
                // fallback to English if translation fails
                console.warn('Translation failed, using English');
                setTranslations(baseStrings);
            }
        } catch (error) {
            console.error('Translation error:', error);
            setTranslations(baseStrings);
        } finally {
            setLoading(false);
        }
    };

    const t = (key) => {
        return translations[key] || baseStrings[key] || key;
    };

    // RTL Languages
    const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
    const isRTL = RTL_LANGUAGES.includes(language);

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage: changeLanguage,
            t,
            loading,
            supportedLanguages: SUPPORTED_LANGUAGES,
            isRTL
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
