import { useState, useEffect } from "react";
import { MapPin, Plane, Info, ChevronLeft, User } from "lucide-react";
import { getColors, Colors } from "../../utils/colors.js";
import { useAppState } from "../../state/appState.jsx";
import {
  readCachedCityPack,
  getCachedCities,
} from "../../services/cityPackService.js";

const BREADCRUMBS = ["Africa", "West Africa", "Ghana"];

// A static fallback list matching the mobile source
const FALLBACK_CITIES = [
  { name: "Accra", selected: true },
  { name: "Kumasi", selected: false },
  { name: "Tamale", selected: false },
  { name: "Cape Coast", selected: false },
];

export function OfflineCityPickerScreen({ params, isOnline, isDark }) {
  const colors = getColors(isDark ?? true);
  const { state, dispatch } = useAppState();

  const [cities, setCities] = useState(FALLBACK_CITIES);
  const [selectedCity, setSelectedCity] = useState("Accra");
  const [cacheInfo, setCacheInfo] = useState(null);

  useEffect(() => {
    // Try to load cities from the city pack service
    try {
      const cached = readCachedCityPack();
      if (cached?.cities?.length) {
        // Map them to the shape we need; keep the first few as a Ghana subset or show all
        const mapped = cached.cities.slice(0, 20).map((c, i) => ({
          name: c.name,
          country: c.country,
          selected: i === 0,
        }));
        setCities(mapped);
        if (cached.generatedAt) {
          const d = new Date(cached.generatedAt);
          setCacheInfo(
            `Showing cached data from ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          );
        }
      }
    } catch {
      // Use fallback
    }
  }, []);

  function handleSelectCity(cityName) {
    setSelectedCity(cityName);
    setCities((prev) =>
      prev.map((c) => ({ ...c, selected: c.name === cityName }))
    );

    // Navigate back with the chosen city
    if (params?.onSelect) {
      params.onSelect(cityName);
    }
    dispatch({ type: "GO_BACK" });
  }

  return (
    <div
      className="min-h-[100dvh] overflow-y-auto pb-24 relative"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <button
          onClick={() => dispatch({ type: "GO_BACK" })}
          className="flex items-center gap-1 text-sm"
          style={{ color: colors.text }}
        >
          <ChevronLeft size={18} />
          Back
        </button>
        <button>
          <User size={20} color={colors.text} />
        </button>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center py-6 gap-2.5">
        <Plane size={56} color={Colors.brandGreen} />
        <h1 className="text-2xl font-extrabold" style={{ color: colors.text }}>
          Choose City Offline
        </h1>
        {/* Breadcrumb */}
        <div className="flex items-center">
          {BREADCRUMBS.map((crumb, i, arr) => (
            <span key={crumb}>
              <span className="text-sm font-medium" style={{ color: Colors.brandGreen }}>
                {crumb}
              </span>
              {i < arr.length - 1 && (
                <span className="text-sm" style={{ color: colors.subtext }}>
                  {" › "}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* City list */}
      <div className="px-4 flex flex-col gap-2.5">
        {cities.map((city) => (
          <button
            key={city.name}
            onClick={() => handleSelectCity(city.name)}
            className="w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <MapPin size={18} color={Colors.brandGreen} />
            <span className="flex-1 text-base font-semibold" style={{ color: colors.text }}>
              {city.name}
              {city.country ? (
                <span className="text-xs font-normal ml-1" style={{ color: colors.subtext }}>
                  {city.country}
                </span>
              ) : null}
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: city.name === selectedCity ? Colors.brandGreen : colors.subtext }}
            >
              {city.name === selectedCity ? "Selected ›" : "›"}
            </span>
          </button>
        ))}
      </div>

      {/* Toast */}
      <div
        className="fixed left-4 right-4 bottom-4 flex items-center gap-2 rounded-xl p-3"
        style={{ backgroundColor: "#C8900A" }}
      >
        <Info size={16} color="#fff" />
        <span className="text-xs text-white flex-1">
          {cacheInfo ?? "Showing cached data — connect to refresh"}
        </span>
      </div>
    </div>
  );
}
