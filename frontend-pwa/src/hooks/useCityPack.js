import { useEffect, useState } from "react";
import { getCachedCities, loadCityPack } from "../services/cityPackService.js";

export function useCityPack(isOnline) {
  const [cities, setCities] = useState(() => getCachedCities());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
