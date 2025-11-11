import React from "react";
import { formatPostcode } from "../utils/postcode";

const formatWindSpeed = (value) => {
  if (!Number.isFinite(value)) return "–";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} m/s` : `${rounded.toFixed(1)} m/s`;
};

const formatPressure = (value) => {
  if (!Number.isFinite(value)) return "–";
  return `${value.toFixed(3)} kPa`;
};

const WindResults = ({ wind }) => {
  if (!wind) return null;

  const sourceMessage =
    wind.source === "dataset"
      ? `Derived from postcode wind dataset (${formatPostcode(wind.match)})`
      : "Estimated using fallback rules (no dataset match)";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-medium">Wind results</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
      </div>
      <p className="mt-4 text-xs text-gray-500">{sourceMessage}</p>
    </div>
  );
};

export default WindResults;
