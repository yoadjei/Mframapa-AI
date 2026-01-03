
import React, { createContext, useContext, useState, useEffect } from 'react';
import { baseStrings, translateUI, SUPPORTED_LANGUAGES } from '../services/gemini';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');
    const [translations, setTranslations] = useState(baseStrings);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 1. Check URL Parameter (e.g. ?lang=fr)
        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');

        // 2. Detect Browser Language
        const browserLang = navigator.language.split('-')[0].toLowerCase();

        // Priority: URL > Browser
        const targetLang = urlLang || browserLang;

        // 3. Check if supported
        if (SUPPORTED_LANGUAGES[targetLang]) {
            changeLanguage(targetLang);
        }
    }, []);

    // Expose for testing via Console
    useEffect(() => {
        window.setAppLanguage = changeLanguage;
        return () => delete window.setAppLanguage;
    }, [language]);

    const changeLanguage = async (langCode) => {
        if (langCode === language) return;

        setLanguage(langCode);

        // If English, just use base strings
        if (langCode === 'en') {
            setTranslations(baseStrings);
            return;
        }

        // Call Gemini to translate
        setLoading(true);
        try {
            const translated = await translateUI(langCode);
            setTranslations(translated);
        } catch (error) {
            console.error("Failed to load translations", error);
            // Keep previous or fallback
        } finally {
            setLoading(false);
        }
    };

    const t = (key) => {
        return translations[key] || baseStrings[key] || key;
    };

    // RTL Languages Map
    const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']; // Add others as needed
    const isRTL = RTL_LANGUAGES.includes(language);


    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, loading, supportedLanguages: SUPPORTED_LANGUAGES, isRTL }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
