import React, { createContext, useContext, useState, useEffect } from 'react';

// import all locale files statically
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import ar from '../locales/ar.json';
import sw from '../locales/sw.json';
import tw from '../locales/tw.json';
import pt from '../locales/pt.json';
import es from '../locales/es.json';
import am from '../locales/am.json';
import ha from '../locales/ha.json';
import yo from '../locales/yo.json';
import ig from '../locales/ig.json';
import zu from '../locales/zu.json';
import xh from '../locales/xh.json';
import af from '../locales/af.json';
import sn from '../locales/sn.json';
import rw from '../locales/rw.json';
import mg from '../locales/mg.json';
import so from '../locales/so.json';
import ti from '../locales/ti.json';
import wo from '../locales/wo.json';
import st from '../locales/st.json';
import tn from '../locales/tn.json';
import ny from '../locales/ny.json';
import rn from '../locales/rn.json';
import ss from '../locales/ss.json';
import nd from '../locales/nd.json';
import ga from '../locales/ga.json';

const LanguageContext = createContext();

// supported languages with flags
export const SUPPORTED_LANGUAGES = {
    'en': { name: 'English', flag: '🇬🇧' },
    'fr': { name: 'French', flag: '🇫🇷' },
    'ar': { name: 'Arabic', flag: '🇸🇦' },
    'pt': { name: 'Portuguese', flag: '🇵🇹' },
    'es': { name: 'Spanish', flag: '🇪🇸' },
    'sw': { name: 'Swahili', flag: '🇰🇪' },
    'am': { name: 'Amharic', flag: '🇪🇹' },
    'ha': { name: 'Hausa', flag: '🇳🇬' },
    'yo': { name: 'Yoruba', flag: '🇳🇬' },
    'ig': { name: 'Igbo', flag: '🇳🇬' },
    'tw': { name: 'Twi', flag: '🇬🇭' },
    'zu': { name: 'Zulu', flag: '🇿🇦' },
    'xh': { name: 'Xhosa', flag: '🇿🇦' },
    'af': { name: 'Afrikaans', flag: '🇿🇦' },
    'sn': { name: 'Shona', flag: '🇿🇼' },
    'rw': { name: 'Kinyarwanda', flag: '🇷🇼' },
    'mg': { name: 'Malagasy', flag: '🇲🇬' },
    'so': { name: 'Somali', flag: '🇸🇴' },
    'ti': { name: 'Tigrinya', flag: '🇪🇷' },
    'wo': { name: 'Wolof', flag: '🇸🇳' },
    'st': { name: 'Sotho', flag: '🇱🇸' },
    'tn': { name: 'Tswana', flag: '🇧🇼' },
    'ny': { name: 'Chichewa', flag: '🇲🇼' },
    'rn': { name: 'Kirundi', flag: '🇧🇮' },
    'ss': { name: 'Swati', flag: '🇸🇿' },
    'nd': { name: 'Ndebele', flag: '🇿🇼' },
    'ga': { name: 'Ga', flag: '🇬🇭' }
};

// all translations loaded at build time
const translations = {
    en, fr, ar, sw, tw, pt, es, am, ha, yo, ig, zu, xh, af,
    sn, rw, mg, so, ti, wo, st, tn, ny, rn, ss, nd, ga
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem('language');
        if (saved && SUPPORTED_LANGUAGES[saved]) return saved;
        return 'en';
    });

    useEffect(() => {
        const saved = localStorage.getItem('language');
        if (saved) return;

        const params = new URLSearchParams(window.location.search);
        const urlLang = params.get('lang');
        if (urlLang && SUPPORTED_LANGUAGES[urlLang]) {
            changeLanguage(urlLang);
            return;
        }

        const browserLang = navigator.language.split('-')[0].toLowerCase();
        if (SUPPORTED_LANGUAGES[browserLang] && browserLang !== 'en') {
            changeLanguage(browserLang);
        }
    }, []);

    useEffect(() => {
        window.setAppLanguage = changeLanguage;
        return () => delete window.setAppLanguage;
    }, []);

    const changeLanguage = (langCode) => {
        if (langCode === language) return;
        localStorage.setItem('language', langCode);
        setLanguageState(langCode);
    };

    const t = (key) => {
        const currentTranslations = translations[language] || translations.en;
        return currentTranslations[key] || translations.en[key] || key;
    };

    const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];
    const isRTL = RTL_LANGUAGES.includes(language);

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage: changeLanguage,
            t,
            loading: false,
            supportedLanguages: SUPPORTED_LANGUAGES,
            isRTL
        }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
