import { useAppState } from "../../state/appState.jsx";

export function SettingsScreen() {
  const { state, dispatch } = useAppState();

  const setTheme = (theme) => dispatch({ type: "UPDATE_PREFERENCES", payload: { theme } });

  return (
    <section className="space-y-4">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold">Theme</h2>
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
              {theme}
            </button>
          ))}
        </div>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-base font-bold">Preferences</h2>
        <label className="mt-3 flex items-center justify-between">
          <span className="text-sm">Notifications</span>
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
          <span className="text-sm">Privacy mode</span>
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
            value={state.preferences.privacyMode}
            onChange={(event) =>
              dispatch({ type: "UPDATE_PREFERENCES", payload: { privacyMode: event.target.value } })
            }
          >
            <option value="strict">Strict</option>
            <option value="balanced">Balanced</option>
            <option value="open">Open</option>
          </select>
        </label>
        <label className="mt-3 flex items-center justify-between">
          <span className="text-sm">Lite mode (reduced map detail)</span>
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
        Sign out
      </button>
    </section>
  );
}
