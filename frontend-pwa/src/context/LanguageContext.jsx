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
import ee from '../locales/ee.json';

const LanguageContext = createContext();

// supported languages with country codes for flag-icons
export const SUPPORTED_LANGUAGES = {
    'en': { name: 'English', countryCode: 'gb' },
    'fr': { name: 'French', countryCode: 'fr' },
    'ar': { name: 'Arabic', countryCode: 'sa' },
    'pt': { name: 'Portuguese', countryCode: 'pt' },
    'es': { name: 'Spanish', countryCode: 'es' },
    'sw': { name: 'Swahili', countryCode: 'ke' },
    'am': { name: 'Amharic', countryCode: 'et' },
    'ha': { name: 'Hausa', countryCode: 'ng' },
    'yo': { name: 'Yoruba', countryCode: 'ng' },
    'ig': { name: 'Igbo', countryCode: 'ng' },
    'tw': { name: 'Twi', countryCode: 'gh' },
    'zu': { name: 'Zulu', countryCode: 'za' },
    'xh': { name: 'Xhosa', countryCode: 'za' },
    'af': { name: 'Afrikaans', countryCode: 'za' },
    'sn': { name: 'Shona', countryCode: 'zw' },
    'rw': { name: 'Kinyarwanda', countryCode: 'rw' },
    'mg': { name: 'Malagasy', countryCode: 'mg' },
    'so': { name: 'Somali', countryCode: 'so' },
    'ti': { name: 'Tigrinya', countryCode: 'er' },
    'wo': { name: 'Wolof', countryCode: 'sn' },
    'st': { name: 'Sotho', countryCode: 'ls' },
    'tn': { name: 'Tswana', countryCode: 'bw' },
    'ny': { name: 'Chichewa', countryCode: 'mw' },
    'rn': { name: 'Kirundi', countryCode: 'bi' },
    'ss': { name: 'Swati', countryCode: 'sz' },
    'nd': { name: 'Ndebele', countryCode: 'zw' },
    'ga': { name: 'Ga', countryCode: 'gh' },
    'ee': { name: 'Ewe', countryCode: 'gh' }
};

// all translations loaded at build time
const translations = {
    en, fr, ar, sw, tw, pt, es, am, ha, yo, ig, zu, xh, af,
    sn, rw, mg, so, ti, wo, st, tn, ny, rn, ss, nd, ga, ee
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

    // set dir attribute on html element for RTL languages
    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language, isRTL]);

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
