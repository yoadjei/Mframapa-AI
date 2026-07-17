import { useState } from "react";
import { ChevronLeft, Search, Check } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";

const SUPPORTED_LANGUAGES = [
  { code: "ar", name: "Arabic",      flag: "🇪🇬" },
  { code: "fr", name: "French",      flag: "🇫🇷" },
  { code: "pt", name: "Portuguese",  flag: "🇵🇹" },
  { code: "en", name: "English",     flag: "🇬🇧" },
  { code: "tn", name: "Tswana",      flag: "🇧🇼" },
  { code: "rn", name: "Kirundi",     flag: "🇧🇮" },
  { code: "es", name: "Spanish",     flag: "🇪🇸" },
  { code: "ti", name: "Tigrinya",    flag: "🇪🇷" },
  { code: "ss", name: "Swati",       flag: "🇸🇿" },
  { code: "am", name: "Amharic",     flag: "🇪🇹" },
  { code: "tw", name: "Twi",         flag: "🇬🇭" },
  { code: "sw", name: "Swahili",     flag: "🇰🇪" },
  { code: "st", name: "Sotho",       flag: "🇱🇸" },
  { code: "mg", name: "Malagasy",    flag: "🇲🇬" },
  { code: "ny", name: "Chichewa",    flag: "🇲🇼" },
  { code: "ha", name: "Hausa",       flag: "🇳🇬" },
  { code: "yo", name: "Yoruba",      flag: "🇳🇬" },
  { code: "ig", name: "Igbo",        flag: "🇳🇬" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "wo", name: "Wolof",       flag: "🇸🇳" },
  { code: "so", name: "Somali",      flag: "🇸🇴" },
  { code: "zu", name: "Zulu",        flag: "🇿🇦" },
  { code: "xh", name: "Xhosa",       flag: "🇿🇦" },
  { code: "af", name: "Afrikaans",   flag: "🇿🇦" },
  { code: "sn", name: "Shona",       flag: "🇿🇼" },
  { code: "nd", name: "Ndebele",     flag: "🇿🇼" },
  { code: "ga", name: "Ga",          flag: "🇬🇭" },
];

export function LanguageSelectorScreen({ isDark, isOnline, params }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  const colors = getColors(isDark);

  const currentLang = state.preferences?.language ?? "en";
  const [search, setSearch] = useState("");

  const filtered = SUPPORTED_LANGUAGES.filter(
    (l) => !search || l.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(code) {
    dispatch({ type: "UPDATE_PREFERENCES", payload: { language: code } });
    goBack();
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe area top spacer */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header: back button + large title */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <button
          type="button"
          onClick={goBack}
          className="flex items-center justify-center active:opacity-60"
        >
          <ChevronLeft size={22} color={colors.text} />
        </button>
        <span
          className="flex-1 text-[26px] font-extrabold"
          style={{ color: colors.text }}
        >
          {t("language.title")}
        </span>
      </div>

      {/* Search bar */}
      <div
        className="mx-4 my-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ backgroundColor: colors.surface }}
      >
        <Search size={16} color={colors.muted} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="flex-1 bg-transparent text-[15px] outline-none"
          style={{ color: colors.text }}
        />
      </div>

      {/* Section header */}
      <p
        className="px-4 pb-2 pt-4 text-[13px] font-bold"
        style={{ color: colors.text, backgroundColor: colors.card }}
      >
        {t("language.supported")}
      </p>

      {/* Language list */}
      <div>
        {filtered.map((item) => {
          const selected = currentLang === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item.code)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:opacity-60"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <span className="text-[20px]">{item.flag}</span>
              <span className="flex-1 text-[15px]" style={{ color: colors.text }}>
                {item.name}
              </span>
              {selected && <Check size={18} color={Colors.brandGreen} />}
            </button>
          );
        })}
      </div>

      {/* Bottom safe area spacer */}
      <div style={{ height: "calc(env(safe-area-inset-bottom) + 100px)" }} />
    </div>
  );
}
