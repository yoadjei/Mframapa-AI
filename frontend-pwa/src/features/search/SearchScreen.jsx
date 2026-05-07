import { useMemo, useState } from "react";
import { useAppState } from "../../state/appState.jsx";
import { StateMessage } from "../../components/feedback/StateMessage.jsx";
import { useCityPack } from "../../hooks/useCityPack.js";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const {
    state: { savedCities },
    dispatch,
  } = useAppState();
  const isOnline = useOnlineStatus();
  const { cities } = useCityPack(isOnline);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return cities.slice(0, 25);
    return cities
      .filter(
        (city) =>
          city.name.toLowerCase().includes(text) || city.country.toLowerCase().includes(text)
      )
      .slice(0, 50);
  }, [cities, query]);

  const openCity = (city) => {
    dispatch({ type: "SELECT_CITY", payload: city });
    dispatch({ type: "SET_ACTIVE_SCREEN", payload: "core" });
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Search</label>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="City or country"
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-emerald-300 focus:ring dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      {savedCities.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-semibold">Saved cities</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {savedCities.map((city) => (
              <li key={`${city.name}-${city.country}`}>
                <button
                  type="button"
                  className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-700"
                  onClick={() => openCity(city)}
                >
                  {city.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <StateMessage
          title="No saved cities yet"
          message="Search and run a check to add quick-access cities."
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {results.length ? (
          <ul className="max-h-[24rem] divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
            {results.map((city) => (
              <li key={`${city.name}-${city.country}`}>
                <button
                  type="button"
                  onClick={() => openCity(city)}
                  className="flex w-full items-center justify-between px-3 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-sm font-medium">{city.name}</span>
                  <span className="text-xs text-slate-500">{city.country}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <StateMessage title="No matches" message="Try another city name or country keyword." />
        )}
      </div>
    </section>
  );
}
