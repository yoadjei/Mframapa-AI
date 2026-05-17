import { EN_STRINGS } from '../locales/en';

const memory: Record<string, Record<string, string>> = { en: EN_STRINGS };

const BUNDLED: Record<string, () => Record<string, string>> = {
  en: () => require('../locales/en').default,
  fr: () => require('../locales/fr').default,
  ar: () => require('../locales/ar').default,
  pt: () => require('../locales/pt').default,
  es: () => require('../locales/es').default,
  sw: () => require('../locales/sw').default,
  ha: () => require('../locales/ha').default,
  yo: () => require('../locales/yo').default,
  ig: () => require('../locales/ig').default,
  am: () => require('../locales/am').default,
  tw: () => require('../locales/tw').default,
  rw: () => require('../locales/rw').default,
  rn: () => require('../locales/rn').default,
  so: () => require('../locales/so').default,
  zu: () => require('../locales/zu').default,
  xh: () => require('../locales/xh').default,
  af: () => require('../locales/af').default,
  sn: () => require('../locales/sn').default,
  nd: () => require('../locales/nd').default,
  st: () => require('../locales/st').default,
  tn: () => require('../locales/tn').default,
  ti: () => require('../locales/ti').default,
  ss: () => require('../locales/ss').default,
  mg: () => require('../locales/mg').default,
  ny: () => require('../locales/ny').default,
  wo: () => require('../locales/wo').default,
  ga: () => require('../locales/ga').default,
};

export function getLocaleStrings(lang: string): Record<string, string> {
  if (memory[lang]) return memory[lang];
  const loader = BUNDLED[lang];
  if (loader) {
    try {
      memory[lang] = { ...EN_STRINGS, ...loader() };
    } catch {
      memory[lang] = EN_STRINGS;
    }
  } else {
    memory[lang] = EN_STRINGS;
  }
  return memory[lang];
}

export async function ensureLocaleLoaded(lang: string): Promise<Record<string, string>> {
  return getLocaleStrings(lang);
}
