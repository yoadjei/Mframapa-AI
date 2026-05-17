import { useState } from "react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

export function ProfileScreen() {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const [draft, setDraft] = useState({
    fullName: state.profile.fullName,
    email: state.profile.email,
    organization: state.profile.organization,
  });

  const save = () => {
    dispatch({ type: "UPDATE_PROFILE", payload: draft });
    dispatch({
      type: "ADD_ACTIVITY",
      payload: {
        id: crypto.randomUUID(),
        type: "profile",
        message: t("pwa.profile.updated"),
        createdAt: new Date().toISOString(),
      },
    });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold">{t("pwa.profile.title")}</h2>
        <div className="mt-4 space-y-3">
          <Field
            label={t("pwa.profile.full_name")}
            value={draft.fullName}
            onChange={(value) => setDraft((v) => ({ ...v, fullName: value }))}
          />
          <Field
            label={t("pwa.auth.email")}
            value={draft.email}
            onChange={(value) => setDraft((v) => ({ ...v, email: value }))}
          />
          <Field
            label={t("pwa.profile.organization")}
            value={draft.organization}
            onChange={(value) => setDraft((v) => ({ ...v, organization: value }))}
          />
        </div>
        <button
          type="button"
          onClick={save}
          className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950"
        >
          {t("pwa.profile.save")}
        </button>
      </div>

      <button
        type="button"
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900"
        onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "settings" })}
      >
        {t("pwa.profile.open_settings")}
      </button>
    </section>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-300 focus:ring dark:border-slate-700 dark:bg-slate-950"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
