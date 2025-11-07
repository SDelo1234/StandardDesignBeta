import { useEffect, useState } from "react";

const defaultState = { lat: null, lon: null, displayName: "" };

const toPostcode = (value) => (value || "").toString().replace(/\s+/g, "").toUpperCase();

const useGeo = (postcode) => {
  const [geo, setGeo] = useState(defaultState);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    const pc = toPostcode(postcode);
    if (!pc) {
      setGeo(defaultState);
      setGeoError("");
      return;
    }

    let cancelled = false;
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=gb&limit=1&postalcode=" +
      encodeURIComponent(pc);

    setGeoError("");
    fetch(url)
      .then((response) => response.json())
      .then((results) => {
        if (cancelled) return;
        if (!results || !results.length) {
          setGeo(defaultState);
          setGeoError("Location not found.");
          return;
        }
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        setGeo({ lat, lon, displayName: item.display_name || "" });
        setGeoError("");
      })
      .catch(() => {
        if (cancelled) return;
        setGeo(defaultState);
        setGeoError("Could not fetch map location.");
      });

    return () => {
      cancelled = true;
    };
  }, [postcode]);

  return { geo, geoError, setGeoError };
};

export default useGeo;
