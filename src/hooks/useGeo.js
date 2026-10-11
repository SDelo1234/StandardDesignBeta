import { useEffect, useState } from "react";
import { isValidPostcode, normalisePostcode } from "../utils/postcode";

const defaultState = { lat: null, lon: null, displayName: "" };
const DEBOUNCE_MS = 400;

/** postcodes.io lookup (free, UK-specific, exact postcode centroid). */
export const geocodePostcode = async (postcode) => {
  const response = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(normalisePostcode(postcode))}`,
  );
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Postcode lookup failed (${response.status})`);
  const { result } = await response.json();
  if (!result) return null;
  const place = [result.admin_ward, result.admin_district, result.country].filter(Boolean).join(", ");
  return { lat: result.latitude, lon: result.longitude, displayName: place };
};

export const reverseGeocode = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes?lon=${lon}&lat=${lat}&limit=1&radius=2000`,
    );
    if (!response.ok) return "";
    const { result } = await response.json();
    return (result && result[0] && result[0].postcode) || "";
  } catch {
    return "";
  }
};

const useGeo = (postcode) => {
  const [geo, setGeo] = useState(defaultState);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (!isValidPostcode(postcode)) {
      setGeo(defaultState);
      setGeoError("");
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      geocodePostcode(postcode)
        .then((result) => {
          if (cancelled) return;
          if (!result) {
            setGeo(defaultState);
            setGeoError("Postcode not found.");
            return;
          }
          setGeo(result);
          setGeoError("");
        })
        .catch(() => {
          if (cancelled) return;
          setGeo(defaultState);
          setGeoError("Could not fetch map location.");
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [postcode]);

  return { geo, geoError, setGeoError };
};

export default useGeo;
