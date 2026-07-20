import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

export function MapCanvas({
  viewState,
  onMove,
  onMapClick,
  mapboxToken,
  isDark,
  cities,
  selectedCity,
  liteMode,
  onMarkerClick,
}) {
  const markerLimit = liteMode ? 40 : 140;
  const markers = cities.slice(0, markerLimit);

  return (
    <Map
      {...viewState}
      onMove={onMove}
      onClick={onMapClick}
      mapboxAccessToken={mapboxToken}
      mapStyle={isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"}
      projection="globe"
      style={{ width: "100%", height: "100%" }}
      maxBounds={[[-30, -40], [62, 40]]}
      fog={{
        range: [0.5, 10],
        color: isDark ? "#0b1220" : "#eff6ff",
        "horizon-blend": 0.2,
        "high-color": isDark ? "#1e293b" : "#bfdbfe",
        "space-color": isDark ? "#020617" : "#dbeafe",
        "star-intensity": isDark ? 0.8 : 0.0,
      }}
    >
      {markers.map((city) => (
        <Marker
          key={`${city.name}-${city.lat}`}
          longitude={city.lon}
          latitude={city.lat}
          anchor="center"
          onClick={onMarkerClick ? () => onMarkerClick(city) : undefined}
        >
          {/* a city carrying an aqi colour renders as a heat dot sized by severity;
              otherwise it falls back to the plain locator dot used by the map tab. */}
          {city.color ? (
            <span
              title={city.label ?? city.name}
              style={{
                display: "block",
                width: city.size ?? 14,
                height: city.size ?? 14,
                borderRadius: "50%",
                backgroundColor: city.color,
                boxShadow: `0 0 18px ${city.color}`,
                border: "1.5px solid rgba(255,255,255,0.65)",
                cursor: onMarkerClick ? "pointer" : "default",
              }}
            />
          ) : (
            <span className="block h-2.5 w-2.5 rounded-full bg-emerald-400/90 shadow-[0_0_18px_rgba(16,185,129,0.7)]" />
          )}
        </Marker>
      ))}

      {selectedCity ? (
        <Marker longitude={selectedCity.lon} latitude={selectedCity.lat} anchor="bottom">
          <MapPin className="h-10 w-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
        </Marker>
      ) : null}
    </Map>
  );
}
