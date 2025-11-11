import React from "react";
import TerrainCategorySelector from "./TerrainCategorySelector";
import { formatPostcode } from "../utils/postcode";

const formatAltitudeValue = (value) => {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(rounded)) return null;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} m AOD` : `${rounded.toFixed(1)} m AOD`;
};

const FenceInputs = ({
  form,
  errors,
  onChange,
  autoAltitude,
  altitudeStatus,
  altitudeOverride,
  onAltitudeOverrideChange,
  effectiveAltitude,
  altitudeMatch,
  onTerrainChange,
}) => {
  const renderAltitudeStatus = () => {
    if (altitudeStatus === "loading") {
      return "Looking up altitude…";
    }
    if (altitudeStatus === "error") {
      return "Unable to load altitude data.";
    }
    if (autoAltitude !== null && autoAltitude !== undefined) {
      const formatted = formatAltitudeValue(autoAltitude);
      return formatted || `${autoAltitude} m AOD`;
    }
    if (!form.postcode.trim()) {
      return "Enter a postcode to look up altitude.";
    }
    return "No dataset match for this postcode.";
  };

  const usingAltitude = formatAltitudeValue(effectiveAltitude);

  return (
    <form className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <section className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Project details</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Project name</label>
            <input
              className={`w-full rounded-xl border p-2.5 focus:outline-none focus:ring ${
                errors.projectName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Longreach STW – Perimeter"
              value={form.projectName}
              onChange={(e) => onChange("projectName", e.target.value)}
            />
            {errors.projectName && <p className="mt-1 text-xs text-red-600">{errors.projectName}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Project postcode</label>
            <input
              className={`w-full rounded-xl border p-2.5 uppercase focus:outline-none focus:ring ${
                errors.postcode ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="SW4 6QD"
              value={form.postcode}
              onChange={(e) => onChange("postcode", e.target.value.toUpperCase())}
            />
            {errors.postcode && <p className="mt-1 text-xs text-red-600">{errors.postcode}</p>}
            <p className="mt-1 text-xs text-gray-500">Used to derive site wind data.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Expected duration on site</label>
            <select
              className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring"
              value={form.duration}
              onChange={(e) => onChange("duration", e.target.value)}
            >
              <option>&lt; 28 days</option>
              <option>1–3 months</option>
              <option>3–6 months</option>
              <option>&gt; 6 months</option>
            </select>
          </div>
        </div>
      </section>

      <section className="lg:col-span-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-medium">Site conditions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label className="mb-1 block text-sm font-medium">Ground conditions</label>
            <select
              className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring"
              value={form.ground}
              onChange={(e) => onChange("ground", e.target.value)}
            >
              <option>Hardstanding (concrete/asphalt)</option>
              <option>Firm granular (Type 1/compacted)</option>
              <option>Soft/grass/soil</option>
              <option>Unknown – assume worst case</option>
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <TerrainCategorySelector
              value={form.terrainCategory}
              onChange={onTerrainChange}
              error={errors.terrainCategory}
            />
          </div>
          <div className="lg:col-span-1">
            <label className="mb-1 block text-sm font-medium">Distance to sea</label>
            <input
              className="w-full rounded-xl border p-2.5 focus:outline-none focus:ring"
              placeholder="km"
              value={form.distanceToSea}
              onChange={(e) => onChange("distanceToSea", e.target.value)}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-sm font-medium">Altitude (dataset)</label>
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">
              {renderAltitudeStatus()}
            </div>
            {altitudeMatch && (
              <p className="mt-1 text-xs text-gray-500">
                Matched dataset entry: {formatPostcode(altitudeMatch)}
              </p>
            )}
            <label className="mt-4 mb-1 block text-sm font-medium">Manual altitude override</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              className="w-full rounded-xl border p-2.5 focus:outline-none focus:ring"
              placeholder="m AOD"
              value={altitudeOverride}
              onChange={(e) => onAltitudeOverrideChange(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              {usingAltitude
                ? `Using ${usingAltitude}${altitudeStatus === "error" ? " (manual value)" : ""}`
                : "Leave blank to use the dataset value or enter a manual altitude."}
            </p>
          </div>
          <div className="lg:col-span-1">
            <label className="mb-1 block text-sm font-medium">Fence height</label>
            <select
              className="w-full rounded-xl border border-gray-300 p-2.5 focus:outline-none focus:ring"
              value={form.height}
              onChange={(e) => onChange("height", e.target.value)}
            >
              <option>2.0 m</option>
              <option>2.4 m</option>
              <option>3.0 m</option>
            </select>
          </div>
        </div>
      </section>
    </form>
  );
};

export default FenceInputs;
