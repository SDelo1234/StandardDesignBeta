import React, { useEffect, useMemo, useRef } from "react";
import useGeo from "../hooks/useGeo";

const ensureLeaflet = () =>
  new Promise((resolve, reject) => {
    if (window.L) return resolve(window.L);

    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const jsId = "leaflet-js";
    if (!document.getElementById(jsId)) {
      const script = document.createElement("script");
      script.id = jsId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.body.appendChild(script);
    } else {
      resolve(window.L);
    }
  });

const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
        lat +
        "&lon=" +
        lon +
        "&addressdetails=1"
    );
    const data = await res.json();
    return ((data && data.address && data.address.postcode) || "").toUpperCase();
  } catch (e) {
    return "";
  }
};

const Map = ({ postcode, onPostcodeChange }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const { geo, geoError, setGeoError } = useGeo(postcode);

  const hasPostcode = useMemo(() => Boolean((postcode || "").trim()), [postcode]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.off();
        markerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!hasPostcode) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current.off();
        markerRef.current = null;
      }
      return;
    }

    if (!geo.lat || !geo.lon) {
      return;
    }

    let cancelled = false;

    const upsertMarker = (map, L, lat, lon) => {
      if (markerRef.current) {
        markerRef.current.off();
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      const marker = L.marker([lat, lon], { draggable: true }).addTo(map);
      marker.bindPopup((postcode || "").toString());
      markerRef.current = marker;
      marker.on("dragend", async (ev) => {
        const pos = ev.target.getLatLng();
        const newPostcode = await reverseGeocode(pos.lat, pos.lng);
        if (newPostcode && newPostcode !== postcode) {
          onPostcodeChange(newPostcode.toUpperCase());
        }
      });
    };

    const bindClick = (map, L) => {
      if (map._clickBound) return;
      map.on("click", async (ev) => {
        const { lat, lng } = ev.latlng;
        upsertMarker(map, L, lat, lng);
        const newPostcode = await reverseGeocode(lat, lng);
        if (newPostcode && newPostcode !== postcode) {
          onPostcodeChange(newPostcode.toUpperCase());
        }
      });
      map._clickBound = true;
    };

    ensureLeaflet()
      .then((L) => {
        if (cancelled) return;
        let map = mapRef.current;
        if (!map) {
          if (!containerRef.current) return;
          map = L.map(containerRef.current).setView([geo.lat, geo.lon], 14);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              maxZoom: 19,
              attribution: "&copy; OpenStreetMap",
            })
            .addTo(map);
          mapRef.current = map;
          setTimeout(() => {
            try {
              map.invalidateSize();
            } catch (e) {
              // ignore
            }
          }, 0);
        } else {
          map.setView([geo.lat, geo.lon], 14);
          setTimeout(() => {
            try {
              map.invalidateSize();
            } catch (e) {
              // ignore
            }
          }, 0);
        }

        upsertMarker(map, L, geo.lat, geo.lon);
        bindClick(map, L);
      })
      .catch(() => {
        setGeoError("Could not load map library.");
      });

    return () => {
      cancelled = true;
    };
  }, [geo.lat, geo.lon, hasPostcode, onPostcodeChange, postcode, setGeoError]);

  return (
    <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-medium">Site location map</h2>
      {hasPostcode ? (
        <>
          <div ref={containerRef} className="h-64 w-full rounded-lg" />
          {geoError && <div className="mt-2 text-xs text-red-600">{geoError}</div>}
          {geo.displayName && <div className="mt-2 text-xs text-gray-600">{geo.displayName}</div>}
        </>
      ) : (
        <div className="text-sm text-gray-500">Enter a valid UK postcode to preview the map.</div>
      )}
    </section>
  );
};

export default Map;
