import { useState, useMemo } from "react";
import { Search, Check } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { StackBackButton } from "../../components/navigation/StackBackButton.jsx";
import { SUPPORTED_LANGUAGES, languagesByCountry } from "../../i18n/languages.js";

export function LanguageSelectorScreen({ isDark, isOnline, params }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { goBack } = useNavigation();
  const colors = getColors(isDark);

  const currentLang = state.preferences?.language ?? "en";
  const [search, setSearch] = useState("");

  const sections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matched = !q
      ? SUPPORTED_LANGUAGES
      : SUPPORTED_LANGUAGES.filter((l) => {
          const label = (t(`lang.${l.code}`) || l.name).toLowerCase();
          const country = (t(l.countryKey) || l.country).toLowerCase();
          return (
            label.includes(q) ||
            country.includes(q) ||
            l.name.toLowerCase().includes(q) ||
            l.country.toLowerCase().includes(q) ||
            l.code.toLowerCase().includes(q)
          );
        });
    return languagesByCountry(matched);
  }, [search, t]);

  function handleSelect(code) {
    dispatch({ type: "UPDATE_PREFERENCES", payload: { language: code } });
    goBack();
  }

  return (
    <div style={{ minHeight: "100dvh", backgroundColor: colors.bg }}>
      <div style={{ height: "env(safe-area-inset-top)" }} />

      <div className="flex items-center gap-2 px-4 pt-2 pb-2">
        <StackBackButton
          onClick={goBack}
          color={colors.text}
          variant="chevron"
          ariaLabel={t("common.go_back")}
        />
        <span
          className="flex-1 text-[1.625rem] font-extrabold"
          style={{ color: colors.text }}
        >
          {t("language.title")}
        </span>
      </div>

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
          className="flex-1 bg-transparent text-[0.9375rem] outline-none"
          style={{ color: colors.text }}
        />
      </div>

      <div>
        {sections.map((section) => (
          <div key={section.countryKey || section.country}>
            <p
              className="px-4 pb-2 pt-4 text-[0.75rem] font-bold uppercase tracking-[0.06em]"
              style={{ color: colors.muted }}
            >
              {t(section.countryKey) || section.country}
            </p>
            {section.languages.map((item) => {
              const selected = currentLang === item.code;
              const label = t(`lang.${item.code}`) || item.name;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:opacity-60"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                >
                  <span className="text-[1.25rem]">{item.flag}</span>
                  <span className="flex-1 text-[0.9375rem]" style={{ color: colors.text }}>
                    {label}
                  </span>
                  {selected && <Check size={18} color={Colors.brandGreen} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ height: "calc(env(safe-area-inset-bottom) + 100px)" }} />
    </div>
  );
}
