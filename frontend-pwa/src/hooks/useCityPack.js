import { useEffect, useState } from "react";
import {
  getCachedCities,
  loadCityPack,
  preloadCityPack,
  readCachedCityPack,
} from "../services/cityPackService.js";

/**
 * Instant search from the bundled/cached pack. Network refresh is background-only
 * and only when the cached pack is missing or outdated — never blocks the UI.
 */
export function useCityPack(isOnline) {
  const [cities, setCities] = useState(() => getCachedCities());
  const [loading, setLoading] = useState(() => getCachedCities().length === 0);

  useEffect(() => {
    let active = true;

    loadCityPack({ preferFresh: false })
      .then((pack) => {
        if (!active || !pack?.cities?.length) return;
        setCities(pack.cities);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Quiet upgrade to v3 when online and cache is stale — no spinner.
    if (isOnline) {
      const cached = readCachedCityPack();
      if (!cached || cached.version !== "v4") {
        preloadCityPack()
          .then((pack) => {
            if (!active || !pack?.cities?.length) return;
            setCities(pack.cities);
          })
          .catch(() => undefined);
      }
    }

    return () => {
      active = false;
    };
  }, [isOnline]);

  return { cities, loading };
}
