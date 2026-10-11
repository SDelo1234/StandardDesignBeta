import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Bundled builds lose Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

const UK_CENTRE = [54.5, -3.0];
const SITE_ZOOM = 16;
const TARGET_SNAPSHOT_SIZE = 1000;

/**
 * Site map. The marker is the site location used for distance to sea; it can
 * be dragged or moved by clicking. In drawing mode, clicks add vertices to the
 * fence line instead.
 */
const Map = forwardRef(({ location, onPick, drawing, fenceLine, onFenceLineChange }, ref) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const lineRef = useRef(null);
  const handlers = useRef({});
  handlers.current = { onPick, drawing, onFenceLineChange };

  useImperativeHandle(ref, () => ({
    async captureSnapshot() {
      const node = containerRef.current;
      if (!node || !mapRef.current) return null;
      const width = node.offsetWidth;
      const height = node.offsetHeight;
      if (!width || !height) return null;

      const { default: html2canvas } = await import("html2canvas");
      const scale = Math.max(TARGET_SNAPSHOT_SIZE / height, TARGET_SNAPSHOT_SIZE / width, 1);
      const canvas = await html2canvas(node, { backgroundColor: "#ffffff", useCORS: true, scale, logging: false });

      const crop = document.createElement("canvas");
      crop.width = TARGET_SNAPSHOT_SIZE;
      crop.height = TARGET_SNAPSHOT_SIZE;
      const ctx = crop.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, TARGET_SNAPSHOT_SIZE, TARGET_SNAPSHOT_SIZE);
      const sourceWidth = Math.min(canvas.width, TARGET_SNAPSHOT_SIZE);
      const sourceHeight = Math.min(canvas.height, TARGET_SNAPSHOT_SIZE);
      const sourceX = Math.max(0, Math.round((canvas.width - sourceWidth) / 2));
      const sourceY = Math.max(0, Math.round((canvas.height - sourceHeight) / 2));
      ctx.drawImage(canvas, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, TARGET_SNAPSHOT_SIZE, TARGET_SNAPSHOT_SIZE);
      return crop.toDataURL("image/jpeg", 0.85);
    },
  }), []);

  // Create the map once
  useEffect(() => {
    const map = L.map(containerRef.current, { tap: true }).setView(UK_CENTRE, 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
      crossOrigin: true,
    }).addTo(map);

    map.on("click", (event) => {
      const { lat, lng } = event.latlng;
      const { drawing: isDrawing, onFenceLineChange: onLine, onPick: pick } = handlers.current;
      if (isDrawing) {
        onLine?.((prev) => [...prev, [lat, lng]]);
      } else {
        pick?.(lat, lng);
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      lineRef.current = null;
    };
  }, []);

  // Site marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lon)) {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      return;
    }
    const latLng = [location.lat, location.lon];
    if (!markerRef.current) {
      markerRef.current = L.marker(latLng, { draggable: true, title: "Site location" }).addTo(map);
      markerRef.current.on("dragend", (event) => {
        const pos = event.target.getLatLng();
        handlers.current.onPick?.(pos.lat, pos.lng);
      });
    } else {
      markerRef.current.setLatLng(latLng);
    }
    if (location.source !== "pin") {
      map.setView(latLng, SITE_ZOOM);
    }
  }, [location]);

  // Fence line
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }
    if (fenceLine && fenceLine.length) {
      lineRef.current = L.layerGroup([
        L.polyline(fenceLine, { color: "#003A5D", weight: 4 }),
        ...fenceLine.map((point) =>
          L.circleMarker(point, { radius: 5, color: "#003A5D", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }),
        ),
      ]).addTo(map);
    }
  }, [fenceLine]);

  useEffect(() => {
    const node = containerRef.current;
    if (node) node.style.cursor = drawing ? "crosshair" : "";
  }, [drawing]);

  return <div ref={containerRef} className="isolate z-0 h-72 w-full rounded-xl sm:h-96" role="application" aria-label="Site map" />;
});

export default Map;
