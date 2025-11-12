import React from "react";
import { formatPostcode } from "../utils/postcode";
import { getTerrainOption } from "../utils/terrain";

const formatWindSpeed = (value) => {
  if (!Number.isFinite(value)) return "–";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} m/s` : `${rounded.toFixed(1)} m/s`;
};

const formatPressure = (value) => {
  if (!Number.isFinite(value)) return "–";
  return `${value.toFixed(3)} kPa`;
};

const formatRoughness = (value) => {
  if (!Number.isFinite(value)) return "–";
  return value < 0.01 ? `${value.toFixed(3)} m` : `${value.toFixed(2)} m`;
};

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

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-medium">Wind results</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Wind speed</div>
          <div className="text-2xl font-semibold">{formatWindSpeed(wind.speed_ms)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Wind pressure</div>
          <div className="text-2xl font-semibold">{formatPressure(wind.pressure_kpa)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Vb,map</div>
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
      <p className="mt-4 text-xs text-gray-500">{sourceMessage}</p>
    </div>
  );
};

export default WindResults;
