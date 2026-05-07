import { useEffect, useState } from "react";
import { getCachedCities, loadCityPack } from "../services/cityPackService.js";

export function useCityPack(isOnline) {
  const [cities, setCities] = useState(() => getCachedCities());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    loadCityPack({ preferFresh: Boolean(isOnline) })
      .then((pack) => {
        if (!active) return;
        setCities(pack.cities);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOnline]);

  return { cities, loading };
}
