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
    <form className="space-y-6">
      {/* Project Essentials Card */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 lg:p-8">
        <h2 className="mb-6 text-xl font-semibold text-[var(--mwp-navy)]">Project Essentials</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">Project name</label>
            <input
              className={`w-full rounded-xl border p-3 text-base shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20 ${errors.projectName ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[var(--mwp-navy)]"
                }`}
              placeholder="e.g., Longreach STW – Perimeter"
              value={form.projectName}
              onChange={(e) => onChange("projectName", e.target.value)}
            />
            {errors.projectName && <p className="mt-1.5 text-sm text-red-600">{errors.projectName}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Design requested by (email)</label>
            <input
              type="email"
              className={`w-full rounded-xl border p-3 text-base shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20 ${errors.requestEmail ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[var(--mwp-navy)]"
                }`}
              placeholder="name@example.com"
              value={form.requestEmail}
              onChange={(e) => onChange("requestEmail", e.target.value)}
            />
            {errors.requestEmail && <p className="mt-1.5 text-sm text-red-600">{errors.requestEmail}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Project postcode</label>
            <input
              className={`w-full rounded-xl border p-3 text-base uppercase shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20 ${errors.postcode ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[var(--mwp-navy)]"
                }`}
              placeholder="SW4 6QD"
              value={form.postcode}
              onChange={(e) => onChange("postcode", e.target.value.toUpperCase())}
            />
            {errors.postcode && <p className="mt-1.5 text-sm text-red-600">{errors.postcode}</p>}
          </div>
        </div>
      </section>

      {/* Schedule & Logistics Card */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 lg:p-8">
        <h2 className="mb-6 text-xl font-semibold text-[var(--mwp-navy)]">Schedule & Logistics</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Month installed</label>
            <select
              className={`w-full rounded-xl border p-3 text-base shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20 ${errors.installationMonth ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[var(--mwp-navy)]"
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
              <p className="mt-1.5 text-sm text-red-600">{errors.installationMonth}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Expected duration</label>
            <select
              className={`w-full rounded-xl border p-3 text-base shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20 ${errors.durationCategory ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[var(--mwp-navy)]"
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
              <p className="mt-1.5 text-sm text-red-600">{errors.durationCategory}</p>
            )}
          </div>
        </div>
      </section>

      {/* Site Conditions Card */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 lg:p-8">
        <h2 className="mb-6 text-xl font-semibold text-[var(--mwp-navy)]">Site Conditions</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Ground conditions</label>
            <select
              className="w-full rounded-xl border border-gray-200 p-3 text-base shadow-sm transition-colors focus:border-[var(--mwp-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20"
              value={form.ground}
              onChange={(e) => onChange("ground", e.target.value)}
            >
              <option>Hardstanding (concrete/asphalt)</option>
              <option>Firm granular (Type 1/compacted)</option>
              <option>Soft/grass/soil</option>
              <option>Unknown – assume worst case</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Fence height</label>
            <select
              className="w-full rounded-xl border border-gray-200 p-3 text-base shadow-sm transition-colors focus:border-[var(--mwp-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20"
              value={form.height}
              onChange={(e) => onChange("height", e.target.value)}
            >
              <option>2.0 m</option>
              <option>2.4 m</option>
              <option>3.0 m</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <TerrainCategorySelector
              value={form.terrainCategory}
              onChange={onTerrainChange}
              error={errors.terrainCategory}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Distance to sea</label>
            <div className="relative">
              <input
                className="w-full rounded-xl border border-gray-200 p-3 text-base shadow-sm transition-colors focus:border-[var(--mwp-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20"
                placeholder="e.g. 5.2"
                value={form.distanceToSea}
                onChange={(e) => onChange("distanceToSea", e.target.value)}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500">km</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Use{" "}
              <a
                href="https://www.doogal.co.uk/DistanceToSea"
                className="font-medium text-[var(--mwp-navy)] hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                Doogal distance to sea
              </a>
              {" "}if unsure.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Altitude (dataset)</label>
            <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-base text-[var(--mwp-navy)]">
              {renderAltitudeStatus()}
            </div>
            {altitudeMatch && (
              <p className="mt-1.5 text-xs text-gray-500">
                Matched: {formatPostcode(altitudeMatch)}
              </p>
            )}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Manual override</label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  className="w-full rounded-xl border border-gray-200 p-3 text-base shadow-sm transition-colors focus:border-[var(--mwp-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--mwp-navy)]/20"
                  placeholder="m AOD"
                  value={altitudeOverride}
                  onChange={(e) => onAltitudeOverrideChange(e.target.value)}
                />
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                {usingAltitude
                  ? `Using ${usingAltitude}${altitudeStatus === "error" ? " (manual)" : ""}`
                  : "Leave blank to use dataset."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </form>
  );
};

export default FenceInputs;
