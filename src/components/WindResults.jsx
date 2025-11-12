import React from "react";
import { formatPostcode } from "../utils/postcode";
import { getTerrainOption } from "../utils/terrain";
import {
  formatFactor,
  formatPressure,
  formatRoughness,
  formatWindSpeed,
} from "../utils/formatters";

const WindResults = ({ wind }) => {
  if (!wind) return null;

  const sourceMessage =
    wind.source === "dataset"
      ? `Derived from postcode wind dataset (${formatPostcode(wind.match)})`
      : "Estimated using fallback rules (no dataset match)";

  const terrainOption = getTerrainOption(wind.terrainCategory);
  const terrainLabel = terrainOption
    ? terrainOption.title
    : wind.terrainCategory || "–";

  const factors = wind.derivedFactors;
  const vbValue = factors?.vb_ms ?? wind.speed_ms;
  const qbValue = factors?.qb_kpa ?? wind.pressure_kpa;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-medium">Wind results</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Basic wind speed (Vb)</div>
          <div className="text-2xl font-semibold">{formatWindSpeed(vbValue)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Basic wind pressure (qb)</div>
          <div className="text-2xl font-semibold">{formatPressure(qbValue)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Map wind speed (Vb,map)</div>
          <div className="text-2xl font-semibold">{formatWindSpeed(wind.vb_map)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Terrain category</div>
          <div className="text-sm font-semibold text-gray-900">{terrainLabel}</div>
          {terrainOption?.desc && (
            <div className="mt-1 text-xs text-gray-600">{terrainOption.desc}</div>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Surface roughness z₀</div>
          <div className="text-2xl font-semibold">{formatRoughness(wind.terrainRoughness_z0_m)}</div>
        </div>
      </div>
      {factors && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Wind factors</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="BS EN 1991-1-6 Table 3.1 (actions during execution)"
            >
              <div className="text-xs text-gray-500">Return period (Tr)</div>
              <div className="text-2xl font-semibold">
                {factors.returnPeriodYears ? `${factors.returnPeriodYears} years` : "–"}
              </div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="UK NA to EN 1991-1-4 Table NA.2"
            >
              <div className="text-xs text-gray-500">C_prob</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cProb)}</div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="UK NA to EN 1991-1-4 Table NA.2"
            >
              <div className="text-xs text-gray-500">C_season</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cSeason)}</div>
              <div className="mt-1 text-xs text-gray-600">Start month based</div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="UK NA to EN 1991-1-4 Equation NA.2a"
            >
              <div className="text-xs text-gray-500">C_alt</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cAlt)}</div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="Direction factor assumed per UK NA to EN 1991-1-4"
            >
              <div className="text-xs text-gray-500">C_dir</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cDir)}</div>
            </div>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-gray-500">{sourceMessage}</p>
    </div>
  );
};

export default WindResults;
