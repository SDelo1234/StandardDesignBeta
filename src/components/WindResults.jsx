import React from "react";

const WindResults = ({ wind }) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm">
    <h2 className="mb-2 text-lg font-medium">Wind results (example)</h2>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500">Calculated wind speed</div>
        <div className="text-2xl font-semibold">{wind.speed_ms.toFixed(0)} m/s</div>
      </div>
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500">Calculated wind pressure</div>
        <div className="text-2xl font-semibold">{wind.pressure_kpa.toFixed(3)} kPa</div>
      </div>
    </div>
  </div>
);

export default WindResults;
