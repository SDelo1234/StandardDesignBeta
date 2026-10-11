import React from "react";
import TerrainCategorySelector from "./TerrainCategorySelector";
import { Field, Section, SourceBadge, inputClass } from "./ui";
import { formatAltitudeValue, formatWindSpeed } from "../utils/formatters";
import { DURATION_OPTIONS, GROUND_OPTIONS, HEIGHT_OPTIONS, MONTH_LABELS } from "../utils/formOptions";

export const ProjectSection = ({ form, errorFor, onChange, onBlur }) => (
  <Section step={1} title="Project">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Project name" error={errorFor("projectName")}>
        {(props) => (
          <input
            {...props}
            className={inputClass(errorFor("projectName"))}
            placeholder="e.g., Longreach STW – Perimeter"
            value={form.projectName}
            onChange={(e) => onChange("projectName", e.target.value)}
            onBlur={() => onBlur("projectName")}
          />
        )}
      </Field>
      <Field label="Design requested by (email)" error={errorFor("requestEmail")} help="Shown in the PDF header.">
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="email"
            className={inputClass(errorFor("requestEmail"))}
            placeholder="name@example.com"
            value={form.requestEmail}
            onChange={(e) => onChange("requestEmail", e.target.value)}
            onBlur={() => onBlur("requestEmail")}
          />
        )}
      </Field>
    </div>
  </Section>
);

const statusBadge = (status, exact, labels) => {
  if (status === "loading") return <SourceBadge kind="loading">Looking up…</SourceBadge>;
  if (status === "ready") {
    return exact ? (
      <SourceBadge kind="dataset">{labels.exact}</SourceBadge>
    ) : (
      <SourceBadge kind="approx">{labels.approx}</SourceBadge>
    );
  }
  if (status === "missing" || status === "error") return <SourceBadge kind="missing">Missing</SourceBadge>;
  return null;
};

export const SiteDataSection = ({
  form,
  onChange,
  wind,
  windStatus,
  altitude,
  altitudeStatus,
  autoDistance,
  locationSource,
}) => {
  const vbManual = form.vbMapOverride.trim() !== "";
  const altManual = form.altitudeOverride.trim() !== "";
  const seaManual = form.distanceToSeaOverride.trim() !== "";

  const windText =
    windStatus === "ready"
      ? `${formatWindSpeed(wind.vb_map)} (${wind.exact ? "district" : "nearest prefix"} ${wind.match})`
      : windStatus === "loading"
      ? "Looking up…"
      : windStatus === "idle"
      ? "Enter a postcode."
      : "No dataset value – enter vb,map from UK NA Figure NA.1.";

  const altitudeText =
    altitudeStatus === "ready"
      ? `${formatAltitudeValue(altitude.altitude)} (${altitude.match})`
      : altitudeStatus === "loading"
      ? "Looking up…"
      : altitudeStatus === "idle"
      ? "Enter a postcode."
      : "No dataset value – enter the site altitude.";

  const seaText =
    autoDistance !== null
      ? `${autoDistance} km from the ${locationSource === "pin" ? "map pin" : "postcode centre"}`
      : "Set the site location to calculate.";

  return (
    <Section step={3} title="Site data">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Field
          label="Basic wind speed vb,map"
          badge={vbManual ? <SourceBadge kind="manual">Manual</SourceBadge> : statusBadge(windStatus, wind?.exact, { exact: "Dataset", approx: "Nearest district" })}
          help={windText}
        >
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              className={inputClass(false)}
              placeholder="Override (m/s)"
              value={form.vbMapOverride}
              onChange={(e) => onChange("vbMapOverride", e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Site altitude"
          badge={altManual ? <SourceBadge kind="manual">Manual</SourceBadge> : statusBadge(altitudeStatus, altitude?.exact, { exact: "Dataset", approx: "Sector max" })}
          help={altitudeText}
        >
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              step="1"
              className={inputClass(false)}
              placeholder="Override (m AOD)"
              value={form.altitudeOverride}
              onChange={(e) => onChange("altitudeOverride", e.target.value)}
            />
          )}
        </Field>
        <Field
          label="Distance to sea"
          badge={
            seaManual ? (
              <SourceBadge kind="manual">Manual</SourceBadge>
            ) : autoDistance !== null ? (
              <SourceBadge kind="approx">Auto ±5 km</SourceBadge>
            ) : null
          }
          help={seaText}
        >
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              className={inputClass(false)}
              placeholder="Override (km)"
              value={form.distanceToSeaOverride}
              onChange={(e) => onChange("distanceToSeaOverride", e.target.value)}
            />
          )}
        </Field>
      </div>
      <p className="mt-3 text-xs text-gray-500">
        Leave the boxes blank to use the looked-up values. The auto distance to sea is approximate; within 2 km of the
        coast, measure it and enter it.
      </p>
    </Section>
  );
};

export const ExposureSection = ({ form, onChange }) => (
  <Section step={4} title="Exposure">
    <div className="space-y-5">
      <TerrainCategorySelector value={form.terrain} onChange={(value) => onChange("terrain", value)} />
      {form.terrain === "town" && (
        <Field
          label="Distance inside town"
          help="Distance from the upwind edge of the town to the site. No town reduction is taken within 1 km."
          className="max-w-xs"
        >
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              className={inputClass(false)}
              placeholder="km"
              value={form.distanceIntoTown}
              onChange={(e) => onChange("distanceIntoTown", e.target.value)}
            />
          )}
        </Field>
      )}

      <div className="rounded-xl border border-gray-200 p-4">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 rounded border-gray-300"
            checked={form.orographySignificant}
            onChange={(e) => onChange("orographySignificant", e.target.checked)}
          />
          <span>
            <span className="font-medium">Site is on or near a hill, ridge, cliff or escarpment</span>
            <span className="block text-xs text-gray-600">
              Orography is significant where the upwind slope is steeper than 1 in 20 (EN 1991-1-4 4.3.3).
            </span>
          </span>
        </label>
        {form.orographySignificant && (
          <Field
            label="Orography factor c_o"
            help="From EN 1991-1-4 Annex A.3. Applied as c_o² on qp."
            className="mt-3 max-w-xs"
          >
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="1"
                className={inputClass(false)}
                placeholder="e.g., 1.15"
                value={form.co}
                onChange={(e) => onChange("co", e.target.value)}
              />
            )}
          </Field>
        )}
      </div>

      <details className="rounded-xl border border-gray-200 p-4">
        <summary className="cursor-pointer text-sm font-medium">Engineering settings</summary>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Exposure factor override ce·ce,T"
            help="Optional. Value read from UK NA Figures NA.7 and NA.8; replaces the built-in approximation."
          >
            {(props) => (
              <input
                {...props}
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                className={inputClass(false)}
                placeholder="e.g., 1.85"
                value={form.ceOverride}
                onChange={(e) => onChange("ceOverride", e.target.value)}
              />
            )}
          </Field>
          <label className="flex items-start gap-3 text-sm md:mt-6">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 rounded border-gray-300"
              checked={form.combineSeasonAndProb}
              onChange={(e) => onChange("combineSeasonAndProb", e.target.checked)}
            />
            <span>
              <span className="font-medium">Combine c_season with c_prob</span>
              <span className="block text-xs text-gray-600">
                Untick to apply c_prob only. The 20 m/s execution minimum applies either way.
              </span>
            </span>
          </label>
        </div>
      </details>
    </div>
  </Section>
);

export const ProgrammeSection = ({ form, errorFor, onChange, onBlur }) => (
  <Section step={5} title="Programme">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Month installed" error={errorFor("installationMonth")}>
        {(props) => (
          <select
            {...props}
            className={inputClass(errorFor("installationMonth"))}
            value={form.installationMonth ?? ""}
            onChange={(e) => onChange("installationMonth", e.target.value ? Number(e.target.value) : null)}
            onBlur={() => onBlur("installationMonth")}
          >
            <option value="">Select month…</option>
            {MONTH_LABELS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field
        label="Expected duration on site"
        error={errorFor("durationCategory")}
        help="Counted from the start of the installation month. If the fence goes up mid-month, choose the next longer duration."
      >
        {(props) => (
          <select
            {...props}
            className={inputClass(errorFor("durationCategory"))}
            value={form.durationCategory ?? ""}
            onChange={(e) => onChange("durationCategory", e.target.value || null)}
            onBlur={() => onBlur("durationCategory")}
          >
            <option value="">Select duration…</option>
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </Field>
    </div>
  </Section>
);

export const FenceSection = ({ form, onChange }) => (
  <Section step={6} title="Fence">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Fence height">
        {(props) => (
          <select
            {...props}
            className={inputClass(false)}
            value={form.height}
            onChange={(e) => onChange("height", Number(e.target.value))}
          >
            {HEIGHT_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h.toFixed(1)} m
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Ground conditions" help="Recorded on the design brief for the fence designer.">
        {(props) => (
          <select
            {...props}
            className={inputClass(false)}
            value={form.ground}
            onChange={(e) => onChange("ground", e.target.value)}
          >
            {GROUND_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        )}
      </Field>
    </div>
  </Section>
);
