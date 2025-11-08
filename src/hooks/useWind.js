import { useEffect, useState } from "react";
import { normalisePostcode } from "../utils/postcode";
import {
  computeFallbackWind,
  ensureDatasets,
  getDatasetCacheSync,
  lookupDatasets,
} from "../utils/datasets";

const makeBaseState = (status = "idle") => ({
  wind: null,
  altitude: null,
  status,
  error: null,
  sources: { wind: null, altitude: null },
});

const useWind = (postcode) => {
  const [state, setState] = useState(() =>
    makeBaseState(getDatasetCacheSync() ? "ready" : "idle"),
  );

  useEffect(() => {
    const cache = getDatasetCacheSync();
    const trimmedInput = (postcode || "").trim();

    if (!trimmedInput) {
      setState(makeBaseState(cache ? "ready" : "idle"));
      return;
    }

    const normalized = normalisePostcode(trimmedInput);
    if (!normalized) {
      setState(makeBaseState(cache ? "ready" : "idle"));
      return;
    }

    const fallbackWind = computeFallbackWind(normalized);
    if (!fallbackWind) {
      setState(makeBaseState(cache ? "ready" : "idle"));
      return;
    }

    const applyDatasets = (datasets) => {
      const result = lookupDatasets(datasets, normalized);
      const nextWind = result.wind ?? fallbackWind;
      setState({
        wind: nextWind,
        altitude: result.altitude ?? null,
        status: "ready",
        error: null,
        sources: {
          wind: nextWind.source === "dataset" ? nextWind.match : null,
          altitude: result.altitudeMatch ?? null,
        },
      });
    };

    if (cache) {
      applyDatasets(cache);
      return;
    }

    let cancelled = false;

    setState({
      wind: fallbackWind,
      altitude: null,
      status: "loading",
      error: null,
      sources: { wind: null, altitude: null },
    });

    ensureDatasets()
      .then((datasets) => {
        if (cancelled) return;
        applyDatasets(datasets);
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          wind: fallbackWind,
          altitude: null,
          status: "error",
          error,
          sources: { wind: null, altitude: null },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [postcode]);

  return state;
};

export default useWind;
