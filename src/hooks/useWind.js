import { useEffect, useState } from "react";
import { isValidPostcode, normalisePostcode } from "../utils/postcode";
import { ensureWindIndex, fetchAltitude, lookupWind } from "../utils/datasets";

const emptyState = {
  wind: null,
  windStatus: "idle",
  altitude: null,
  altitudeStatus: "idle",
};

/**
 * Site data for a postcode: vb,map (by district) and altitude (by postcode).
 * There is no fallback: when a value is missing the status says so and the
 * user must enter it manually.
 */
const useWind = (postcode) => {
  const [state, setState] = useState(emptyState);

  useEffect(() => {
    const normalised = normalisePostcode(postcode);
    if (!isValidPostcode(normalised)) {
      setState(emptyState);
      return undefined;
    }

    let cancelled = false;
    setState({ wind: null, windStatus: "loading", altitude: null, altitudeStatus: "loading" });

    ensureWindIndex()
      .then((index) => {
        if (cancelled) return;
        const wind = lookupWind(index, normalised);
        setState((prev) => ({ ...prev, wind, windStatus: wind ? "ready" : "missing" }));
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, wind: null, windStatus: "error" }));
      });

    fetchAltitude(normalised)
      .then((altitude) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, altitude, altitudeStatus: altitude ? "ready" : "missing" }));
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, altitude: null, altitudeStatus: "error" }));
      });

    return () => {
      cancelled = true;
    };
  }, [postcode]);

  return state;
};

export default useWind;
