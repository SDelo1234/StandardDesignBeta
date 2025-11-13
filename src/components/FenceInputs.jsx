import React from "react";
import TerrainCategorySelector from "./TerrainCategorySelector";
import { formatPostcode } from "../utils/postcode";
import { formatAltitudeValue } from "../utils/formatters";
import { DURATION_OPTIONS, MONTH_LABELS } from "../utils/formOptions";

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
            <label className="mb-1 block text-sm font-medium">Month installed</label>
            <select
              className={`w-full rounded-xl border p-2.5 focus:outline-none focus:ring ${
                errors.installationMonth ? "border-red-500" : "border-gray-300"
              }`}
              value={form.installationMonth ?? ""}
              onChange={(e) =>
                onChange(
                  "installationMonth",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
            >
              <option value="">Select month…</option>
              {MONTH_LABELS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            {errors.installationMonth && (
              <p className="mt-1 text-xs text-red-600">{errors.installationMonth}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Expected duration on site</label>
            <select
              className={`w-full rounded-xl border p-2.5 focus:outline-none focus:ring ${
                errors.durationCategory ? "border-red-500" : "border-gray-300"
              }`}
              value={form.durationCategory ?? ""}
              onChange={(e) =>
                onChange("durationCategory", e.target.value || null)
              }
            >
              <option value="">Select duration…</option>
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.durationCategory && (
              <p className="mt-1 text-xs text-red-600">{errors.durationCategory}</p>
            )}
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
            <p className="mt-1 text-xs text-gray-500">
              Need help? Use the
              {" "}
              <a
                href="https://www.doogal.co.uk/DistanceToSea"
                className="font-medium text-[var(--mwp-navy)] underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                Doogal distance to sea calculator
              </a>
              {" "}
              and enter the result here.
            </p>
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
