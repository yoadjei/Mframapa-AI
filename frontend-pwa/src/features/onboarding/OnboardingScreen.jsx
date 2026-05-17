import { useState } from "react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";

const STEP_KEYS = [
  { title: "pwa.onboarding.step1_title", body: "pwa.onboarding.step1_body" },
  { title: "pwa.onboarding.step2_title", body: "pwa.onboarding.step2_body" },
  { title: "pwa.onboarding.step3_title", body: "pwa.onboarding.step3_body" },
];

export function OnboardingScreen({ canInstall, onInstall }) {
  const [step, setStep] = useState(0);
  const { dispatch } = useAppState();
  const { t } = useTranslation();

  const current = STEP_KEYS[step];
  const isLast = step === STEP_KEYS.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          {t("pwa.onboarding.badge")}
        </p>
        <h1 className="mt-8 text-3xl font-bold">{t(current.title)}</h1>
        <p className="mt-4 text-base text-slate-300">{t(current.body)}</p>

        <div className="mt-8 flex gap-2">
          {STEP_KEYS.map((_, index) => (
            <span
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === step ? "w-8 bg-emerald-400" : "w-2 bg-slate-600"
              }`}
            />
          ))}
        </div>

        <div className="mt-10 space-y-3">
          {isLast ? (
            <button
              type="button"
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950"
              onClick={() => dispatch({ type: "COMPLETE_ONBOARDING" })}
            >
              {t("pwa.onboarding.continue")}
            </button>
          ) : (
            <button
              type="button"
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950"
              onClick={() => setStep((value) => value + 1)}
            >
              {t("pwa.onboarding.next")}
            </button>
          )}

          {canInstall ? (
            <button
              type="button"
              className="w-full rounded-xl border border-slate-600 px-4 py-3 text-sm font-medium"
              onClick={onInstall}
            >
              {t("pwa.onboarding.install")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
