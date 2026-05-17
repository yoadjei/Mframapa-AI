import { Activity, Bell, Search, Wind } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppState } from "../../state/appState.jsx";
import { useTranslation } from "../../hooks/useTranslation.js";
import { translateError } from "../../utils/translateError.js";
import { fetchCityPrediction } from "../../services/predictionService.js";
import { checkHealth } from "../../services/api.js";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";

export function HomeScreen({ isOnline }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backendStatus, setBackendStatus] = useState("unknown");
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isOnline) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBackendStatus("offline");
      return;
    }
    let active = true;
    checkHealth()
      .then((health) => {
        if (!active) return;
        setBackendStatus(health.status || "unknown");
      })
      .catch(() => {
        if (!active) return;
        setBackendStatus("offline");
      });
    return () => {
      active = false;
    };
  }, [isOnline]);

  useEffect(() => {
    if (!isOnline || state.homeSummary.pm25 !== null) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    fetchCityPrediction(state.homeSummary.city, state.preferences.language ?? "en")
      .then((result) => {
        if (!active) return;
        dispatch({
          type: "SET_HOME_SUMMARY",
          payload: {
            city: result.city.name,
            pm25: result.pm25,
            aqiCategory: result.category,
            degraded: result.degraded,
            lastUpdated: result.timestamp,
          },
        });
      })
      .catch((requestError) => {
        if (!active) return;
        setError(translateError(t, requestError.message));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, isOnline, state.homeSummary.city, state.homeSummary.pm25, state.preferences.language]);

  return (
    <section className="space-y-4">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl dark:border-slate-700">
        <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-emerald-500/25 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            {t("pwa.home.badge")}
          </p>
          <h1 className="mt-3 text-4xl font-black leading-tight">
            {t("hero.headline_part1")} {t("hero.headline_part2")}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200">{t("pwa.home.subtitle")}</p>
          <button
            type="button"
            onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "core" })}
            className="mt-5 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-bold text-emerald-950"
          >
            {t("hero.cta")}
          </button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <SummaryCard
          label={t("pwa.home.summary_city")}
          value={state.homeSummary.city}
          subValue={
            state.homeSummary.pm25 === null
              ? t("pwa.home.no_reading")
              : `${Math.round(state.homeSummary.pm25)} ${t("card.unit")} · ${state.homeSummary.aqiCategory}`
          }
        />
        <SummaryCard
          label={t("pwa.home.last_updated")}
          value={
            state.homeSummary.lastUpdated
              ? new Date(state.homeSummary.lastUpdated).toLocaleTimeString()
              : t("pwa.home.not_available")
          }
          subValue={state.homeSummary.degraded ? t("pwa.home.degraded") : t("pwa.home.normal")}
        />
        <SummaryCard
          label={t("pwa.home.saved_cities")}
          value={`${state.savedCities.length}`}
          subValue={t("pwa.home.quick_access")}
        />
        <SummaryCard
          label={t("pwa.home.backend")}
          value={backendStatus}
          subValue={backendStatus === "ok" ? t("pwa.home.api_ok") : t("pwa.home.api_check")}
        />
      </div>

      {loading ? (
        <StateMessage title={t("pwa.home.loading_title")} message={t("pwa.home.loading_message")} />
      ) : null}
      {error ? <StateMessage tone="error" title={t("pwa.home.error_title")} message={error} /> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <QuickAction
          icon={Wind}
          label={t("pwa.quick.check")}
          onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "core" })}
        />
        <QuickAction
          icon={Search}
          label={t("pwa.quick.search")}
          onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "search" })}
        />
        <QuickAction
          icon={Bell}
          label={t("pwa.quick.alerts")}
          onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "notifications" })}
        />
        <QuickAction
          icon={Activity}
          label={t("pwa.quick.activity")}
          onClick={() => dispatch({ type: "SET_ACTIVE_SCREEN", payload: "activity" })}
        />
      </div>
    </section>
  );
}

function SummaryCard({ label, value, subValue }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subValue}</p>
    </article>
  );
}

// eslint-disable-next-line no-unused-vars
function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900"
    >
      <Icon size={18} className="text-emerald-500" />
      <p className="mt-2 text-sm font-semibold">{label}</p>
    </button>
  );
}
