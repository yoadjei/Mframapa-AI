import { useState } from "react";
import { useAppState } from "../../state/appState.jsx";

const steps = [
  {
    title: "Check air quality quickly",
    body: "Search any supported African city and get PM2.5 status in seconds.",
  },
  {
    title: "Stay informed offline",
    body: "The app keeps your recent checks for low-connectivity situations.",
  },
  {
    title: "Control your privacy",
    body: "You can use manual city selection and avoid constant location tracking.",
  },
];

export function OnboardingScreen({ canInstall, onInstall }) {
  const [step, setStep] = useState(0);
  const { dispatch } = useAppState();

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-16 text-slate-100">
      <div className="mx-auto max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          Mframapa
        </p>
        <h1 className="mt-8 text-3xl font-bold">{current.title}</h1>
        <p className="mt-4 text-base text-slate-300">{current.body}</p>

        <div className="mt-8 flex gap-2">
          {steps.map((_, index) => (
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
              Continue to sign in
            </button>
          ) : (
            <button
              type="button"
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-emerald-950"
              onClick={() => setStep((value) => value + 1)}
            >
              Next
            </button>
          )}

          {canInstall ? (
            <button
              type="button"
              className="w-full rounded-xl border border-slate-600 px-4 py-3 text-sm font-medium"
              onClick={onInstall}
            >
              Install app
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
