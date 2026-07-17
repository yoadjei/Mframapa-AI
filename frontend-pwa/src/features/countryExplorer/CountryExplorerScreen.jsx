import { useState, useMemo } from "react";
import { ChevronLeft, ChevronsUpDown, MapPin, Building2, Leaf, Check } from "lucide-react";
import { useAppState } from "../../state/appState.jsx";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useTranslation } from "../../hooks/useTranslation.js";
import { getColors, Colors } from "../../utils/colors.js";
import { fetchCityPrediction } from "../../services/predictionService.js";

export function CountryExplorerScreen({ isDark }) {
  const { state, dispatch } = useAppState();
  const { goBack, navigate } = useNavigation();
  const { t } = useTranslation();
  const colors = getColors(isDark ?? true);

  // Use savedCities as the PWA equivalent of mobile's offlineCities
  const offlineCities = state.savedCities ?? [];
  const language = state.preferences?.language ?? "en";

  // Unique sorted list of countries represented in savedCities
  const countries = useMemo(() => {
    const set = new Set();
    for (const c of offlineCities) if (c.country) set.add(c.country);
    return Array.from(set).sort();
  }, [offlineCities]);

  const [selectedCountry, setSelectedCountry] = useState(() => countries[0] ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loadingCity, setLoadingCity] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Default to first country once savedCities hydrate
  if (!selectedCountry && countries.length > 0) {
    setSelectedCountry(countries[0]);
  }

  const cities = useMemo(
    () => offlineCities.filter((c) => c.country === selectedCountry),
    [offlineCities, selectedCountry]
  );

  const stats = useMemo(() => {
    const urban = cities.filter((c) => c.urban).length;
    return {
      cities: cities.length.toString(),
      urban: urban.toString(),
      rural: (cities.length - urban).toString(),
    };
  }, [cities]);

  async function openCity(city) {
    if (loadingCity) return;
    setLoadingCity(city.name);
    setErrorMsg(null);
    try {
      const prediction = await fetchCityPrediction(city.name, language);
      dispatch({ type: "SET_HOME_SUMMARY", payload: { city: city.name } });
      navigate("predictionDashboard", { prediction, city });
    } catch {
      setErrorMsg(t("error.prediction"));
    } finally {
      setLoadingCity(null);
    }
  }

  return (
    <div style={{ minHeight: "100dvh" }}>
      {/* Safe area top */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div
        className="flex items-center"
        style={{ paddingHorizontal: 8, paddingTop: 4, paddingBottom: 4 }}
      >
        <div className="flex items-center" style={{ padding: 8 }}>
          <button
            type="button"
            onClick={goBack}
            className="flex items-center justify-center rounded-full"
            style={{ width: 40, height: 40 }}
          >
            <ChevronLeft size={24} color={colors.text} />
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center justify-center rounded-full"
          style={{ width: 40, height: 40, padding: 10 }}
        >
          <ChevronsUpDown size={22} color={colors.subtext} />
        </button>
      </div>

      {/* Scrollable content */}
      <div
        className="flex flex-col"
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 4,
          paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
          gap: 10,
        }}
      >
        {/* Country selector row */}
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex items-center active:opacity-70"
          style={{ gap: 10, marginBottom: 8 }}
        >
          <span
            className="font-extrabold"
            style={{ fontSize: 28, color: colors.text, flex: 1, textAlign: "left" }}
          >
            {selectedCountry || t("screen.country.tap_to_choose") || "Tap to choose…"}
          </span>
          <ChevronsUpDown size={20} color={colors.subtext} />
        </button>

        {/* Error message */}
        {errorMsg && (
          <p className="text-[13px]" style={{ color: Colors.danger }}>
            {errorMsg}
          </p>
        )}

        {/* City list or empty state */}
        {cities.length === 0 ? (
          <div
            className="flex flex-col items-center"
            style={{
              borderRadius: 16,
              borderWidth: "1.5px",
              borderStyle: "dashed",
              borderColor: colors.border,
              padding: 24,
              gap: 8,
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <MapPin size={36} color={colors.subtext} />
            <p
              className="text-[14px] text-center"
              style={{ color: countries.length === 0 ? colors.subtext : colors.subtext }}
            >
              {countries.length === 0
                ? "Save cities to explore them by country."
                : t("screen.country.no_cities")}
            </p>
          </div>
        ) : (
          cities.slice(0, 30).map((city) => (
            <button
              key={`${city.name}-${city.lat}`}
              type="button"
              onClick={() => openCity(city)}
              disabled={loadingCity === city.name}
              className="flex items-center active:opacity-75"
              style={{
                backgroundColor: colors.card,
                borderRadius: 14,
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 14,
                paddingBottom: 14,
                gap: 12,
                opacity: loadingCity === city.name ? 0.6 : 1,
                border: "none",
                cursor: loadingCity === city.name ? "wait" : "pointer",
              }}
            >
              {city.urban ? (
                <Building2 size={16} color={Colors.brandGreen} />
              ) : (
                <Leaf size={16} color={Colors.brandGreen} />
              )}
              <span
                className="font-semibold"
                style={{ flex: 1, fontSize: 16, color: colors.text, textAlign: "left" }}
              >
                {city.name}
              </span>
              <span className="text-[12px]" style={{ color: colors.subtext }}>
                {city.lat.toFixed(2)}°, {city.lon.toFixed(2)}°
              </span>
              <ChevronLeft
                size={14}
                color={colors.subtext}
                style={{ transform: "rotate(180deg)" }}
              />
            </button>
          ))
        )}

        {/* Stats card */}
        <div
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            gap: 14,
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span className="text-[17px] font-bold" style={{ color: colors.text }}>
            {t("country.stats_title") || "Coverage Stats"}
          </span>
          <div className="flex flex-wrap" style={{ gap: 18 }}>
            {[
              { label: t("country.stats.cities") || "Cities", value: stats.cities },
              { label: t("screen.country.urban_cities") || "Urban", value: stats.urban },
              { label: t("screen.country.rural_cities") || "Rural", value: stats.rural },
            ].map((item) => (
              <div key={item.label} className="flex flex-col" style={{ width: "28%", gap: 2 }}>
                <span className="text-[12px]" style={{ color: colors.subtext }}>
                  {item.label}
                </span>
                <span className="text-[20px] font-bold" style={{ color: colors.text }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Country picker bottom sheet overlay */}
      {pickerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Backdrop */}
          <div
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setPickerOpen(false)}
          />

          {/* Sheet */}
          <div
            style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
              maxHeight: "70dvh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Handle */}
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: colors.border,
                alignSelf: "center",
                marginBottom: 12,
              }}
            />
            <p
              className="text-[18px] font-bold"
              style={{ color: colors.text, marginBottom: 8 }}
            >
              {t("screen.country.choose_country")}
            </p>

            {countries.length === 0 ? (
              <p
                className="text-[14px] text-center py-8"
                style={{ color: colors.subtext }}
              >
                No countries yet — save some cities first.
              </p>
            ) : (
              <div className="overflow-y-auto flex flex-col">
                {countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(country);
                      setPickerOpen(false);
                    }}
                    className="flex items-center justify-between active:opacity-60"
                    style={{
                      paddingTop: 14,
                      paddingBottom: 14,
                      borderBottom: `0.5px solid ${colors.border}`,
                      border: "none",
                      borderBottomWidth: "0.5px",
                      borderBottomStyle: "solid",
                      borderBottomColor: colors.border,
                      backgroundColor: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <span className="text-[16px]" style={{ color: colors.text }}>
                      {country}
                    </span>
                    {country === selectedCountry && (
                      <Check size={20} color={Colors.brandGreen} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
