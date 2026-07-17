import { ChevronRight, ChevronDown } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";

const SUPPORTED_LANGUAGES = [
  { code: "ar", name: "Arabic",     flag: "🇪🇬" },
  { code: "fr", name: "French",     flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "en", name: "English",    flag: "🇬🇧" },
  { code: "tn", name: "Tswana",     flag: "🇧🇼" },
  { code: "rn", name: "Kirundi",    flag: "🇧🇮" },
  { code: "es", name: "Spanish",    flag: "🇪🇸" },
  { code: "ti", name: "Tigrinya",   flag: "🇪🇷" },
  { code: "ss", name: "Swati",      flag: "🇸🇿" },
  { code: "am", name: "Amharic",    flag: "🇪🇹" },
  { code: "tw", name: "Twi",        flag: "🇬🇭" },
  { code: "sw", name: "Swahili",    flag: "🇰🇪" },
  { code: "st", name: "Sotho",      flag: "🇱🇸" },
  { code: "mg", name: "Malagasy",   flag: "🇲🇬" },
  { code: "ny", name: "Chichewa",   flag: "🇲🇼" },
  { code: "ha", name: "Hausa",      flag: "🇳🇬" },
  { code: "yo", name: "Yoruba",     flag: "🇳🇬" },
  { code: "ig", name: "Igbo",       flag: "🇳🇬" },
  { code: "rw", name: "Kinyarwanda",flag: "🇷🇼" },
  { code: "wo", name: "Wolof",      flag: "🇸🇳" },
  { code: "so", name: "Somali",     flag: "🇸🇴" },
  { code: "zu", name: "Zulu",       flag: "🇿🇦" },
  { code: "xh", name: "Xhosa",      flag: "🇿🇦" },
  { code: "af", name: "Afrikaans",  flag: "🇿🇦" },
  { code: "sn", name: "Shona",      flag: "🇿🇼" },
  { code: "nd", name: "Ndebele",    flag: "🇿🇼" },
  { code: "ga", name: "Ga",         flag: "🇬🇭" },
];

const LOCATION_OPTS = ["off", "balanced", "precise"];

function SectionLabel({ label, colors }) {
  return (
    <p
      className="text-[13px] font-semibold uppercase tracking-wide mt-5 mb-1.5"
      style={{ color: colors.subtext }}
    >
      {label}
    </p>
  );
}

function ToggleRow({ label, sublabel, checked, onChange, colors, noBorder }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5 gap-3"
      style={noBorder ? {} : { borderBottom: `1px solid ${colors.border}` }}
    >
      <div className="flex-1">
        <p className="text-[15px] font-medium" style={{ color: colors.text }}>{label}</p>
        {sublabel ? <p className="text-[12px] mt-0.5" style={{ color: colors.subtext }}>{sublabel}</p> : null}
      </div>
      {/* Styled toggle switch */}
      <label className="relative flex items-center cursor-pointer select-none">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="w-11 h-6 rounded-full transition-colors duration-200"
          style={{ backgroundColor: checked ? Colors.brandGreen : colors.border }}
        />
        <div
          className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </label>
    </div>
  );
}

export function SettingsScreen({ isOnline, isDark }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { navigate } = useNavigation();
  const colors = getColors(isDark ?? true);
  const prefs = state.preferences ?? {};

  const themeMode = prefs.theme ?? "system";
  const alertsEnabled = prefs.notificationsEnabled ?? false;
  const liteMode = prefs.liteMode ?? false;
  const dataAnalytics = prefs.dataAnalytics ?? true;
  const locationSharing = prefs.locationSharing ?? "off";
  const language = prefs.language ?? "en";

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES.find((l) => l.code === "en");

  const THEME_MODES = ["light", "dark", "system"];

  function cycleLocationSharing() {
    const next = LOCATION_OPTS[(LOCATION_OPTS.indexOf(locationSharing) + 1) % LOCATION_OPTS.length];
    dispatch({ type: "UPDATE_PREFERENCES", payload: { locationSharing: next } });
  }

  function locationLabel(val) {
    if (val === "off")      return t("settings.location_off");
    if (val === "balanced") return t("settings.location_balanced");
    return t("settings.location_precise");
  }

  const cardStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 16,
    overflow: "hidden",
  };

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto pb-36 px-4"
      style={{ backgroundColor: colors.bg }}
    >
      <div style={{ paddingTop: 12 }}>

        <p className="text-[28px] font-extrabold mb-5" style={{ color: colors.text }}>
          {t("settings.title")}
        </p>

        {/* ── Appearance ── */}
        <SectionLabel label={t("settings.appearance")} colors={colors} />
        <div style={cardStyle}>
          {/* Theme segmented control */}
          <div
            className="flex items-center justify-between px-4 py-3.5 gap-3"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <p className="text-[15px] font-medium" style={{ color: colors.text }}>
              {t("settings.theme")}
            </p>
            <div
              className="flex rounded-xl overflow-hidden"
              style={{ backgroundColor: colors.surface }}
            >
              {THEME_MODES.map((mode) => {
                const active = themeMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => dispatch({ type: "UPDATE_PREFERENCES", payload: { theme: mode } })}
                    className="px-3 py-1.5 text-[13px] font-semibold capitalize transition-colors"
                    style={{
                      backgroundColor: active ? Colors.brandGreen : "transparent",
                      color: active ? "#fff" : colors.subtext,
                    }}
                  >
                    {t(`settings.${mode}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language row */}
          <button
            type="button"
            onClick={() => navigate("languageSelector")}
            className="flex w-full items-center justify-between px-4 py-3.5 gap-3 active:opacity-60"
          >
            <p className="text-[15px] font-medium" style={{ color: colors.text }}>
              {t("settings.language")}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[16px]">{currentLang?.flag}</span>
              <span className="text-[14px]" style={{ color: colors.text }}>{currentLang?.name}</span>
              <ChevronRight size={14} color={colors.subtext} />
            </div>
          </button>
        </div>

        {/* ── Notifications ── */}
        <SectionLabel label={t("settings.notifications")} colors={colors} />
        <div style={cardStyle}>
          <ToggleRow
            label={t("settings.enable_alerts")}
            checked={alertsEnabled}
            onChange={(v) => dispatch({ type: "UPDATE_PREFERENCES", payload: { notificationsEnabled: v } })}
            colors={colors}
            noBorder
          />
        </div>

        {/* ── Privacy ── */}
        <SectionLabel label={t("settings.privacy_section")} colors={colors} />
        <div style={cardStyle}>
          {/* Location sharing cycle button */}
          <div
            className="flex items-center justify-between px-4 py-3.5 gap-3"
            style={{ borderBottom: `1px solid ${colors.border}` }}
          >
            <p className="text-[15px] font-medium" style={{ color: colors.text }}>
              {t("settings.location_sharing")}
            </p>
            <button
              type="button"
              onClick={cycleLocationSharing}
              className="flex items-center gap-1.5 active:opacity-60"
            >
              <span className="text-[14px]" style={{ color: colors.text }}>
                {locationLabel(locationSharing)}
              </span>
              <ChevronDown size={14} color={colors.subtext} />
            </button>
          </div>

          <ToggleRow
            label={t("settings.data_analytics")}
            checked={dataAnalytics}
            onChange={(v) => dispatch({ type: "UPDATE_PREFERENCES", payload: { dataAnalytics: v } })}
            colors={colors}
            noBorder
          />
        </div>

        {/* ── Performance ── */}
        <SectionLabel label={t("settings.performance")} colors={colors} />
        <div style={cardStyle}>
          <ToggleRow
            label={t("settings.lite")}
            checked={liteMode}
            onChange={(v) => dispatch({ type: "UPDATE_PREFERENCES", payload: { liteMode: v } })}
            colors={colors}
            noBorder
          />
        </div>

      </div>
    </div>
  );
}
