import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export function SettingsScreen() {
  const { state, dispatch } = useAppState();
  const { t, language, setLanguage, loading, supportedLanguages } = useTranslation();

  const setTheme = (theme) => dispatch({ type: "UPDATE_PREFERENCES", payload: { theme } });

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold">{t("pwa.settings.language")}</h2>
        {loading ? (
          <p className="mt-2 text-xs text-slate-500">{t("pwa.settings.language_loading")}</p>
        ) : null}
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${
                language === lang.code
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40"
                  : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
              }`}
            >
              <span>{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold">{t("pwa.settings.theme")}</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {["light", "dark", "system"].map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => setTheme(theme)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${
                state.preferences.theme === theme
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-600"
              }`}
            >
              {t(`settings.${theme}`)}
            </button>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold">{t("pwa.settings.preferences")}</h2>
        <label className="mt-3 flex items-center justify-between">
          <span className="text-sm">{t("pwa.settings.notifications")}</span>
          <input
            type="checkbox"
            checked={state.preferences.notificationsEnabled}
            onChange={(event) =>
              dispatch({
                type: "UPDATE_PREFERENCES",
                payload: { notificationsEnabled: event.target.checked },
              })
            }
          />
        </label>
        <label className="mt-3 block">
          <span className="text-sm">{t("pwa.settings.privacy_mode")}</span>
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            value={state.preferences.privacyMode}
            onChange={(event) =>
              dispatch({ type: "UPDATE_PREFERENCES", payload: { privacyMode: event.target.value } })
            }
          >
            <option value="strict">{t("pwa.settings.privacy_strict")}</option>
            <option value="balanced">{t("pwa.settings.privacy_balanced")}</option>
            <option value="open">{t("pwa.settings.privacy_open")}</option>
          </select>
        </label>
        <label className="mt-3 flex items-center justify-between">
          <span className="text-sm">{t("pwa.settings.lite")}</span>
          <input
            type="checkbox"
            checked={Boolean(state.preferences.liteMode)}
            onChange={(event) =>
              dispatch({
                type: "UPDATE_PREFERENCES",
                payload: { liteMode: event.target.checked },
              })
            }
          />
        </label>
      </article>

      <button
        type="button"
        onClick={() => dispatch({ type: "LOGOUT" })}
        className="w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
      >
        {t("pwa.settings.sign_out")}
      </button>
    </section>
  );
}
