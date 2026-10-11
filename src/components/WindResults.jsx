import React from "react";
import { formatPressure, formatWindSpeed } from "../utils/formatters";

const Stat = ({ label, value, sub, emphasis }) => (
  <div className={`rounded-xl border p-4 ${emphasis ? "border-[var(--mwp-navy)] bg-slate-50" : "border-gray-200"}`}>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-2xl font-semibold tabular-nums">{value}</div>
    {sub && <div className="mt-1 text-xs text-gray-600">{sub}</div>}
  </div>
);

const WindResults = ({ result }) => {
  if (!result?.ok) return null;
  const { factors } = result;
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-medium">Wind results</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Basic wind speed vb"
          value={formatWindSpeed(result.vb)}
          sub={factors.vbMinGoverns ? `Minimum governs (calc ${formatWindSpeed(factors.vbCalc)})` : `T_R = ${factors.returnPeriod} years`}
        />
        <Stat label="Basic pressure qb" value={formatPressure(result.qb)} />
        <Stat
          label="Exposure factor"
          value={(result.ce * result.ceT * result.cOrog).toFixed(2)}
          sub={result.exposureSource === "manual" ? "Entered from NA.7/NA.8" : "Approximation to NA.7/NA.8"}
        />
        <Stat label="Design pressure qp" value={formatPressure(result.qp)} sub="Checked against fence capacity" emphasis />
      </div>
      {result.warnings.length > 0 && (
        <ul className="mt-4 space-y-1 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          {result.warnings.map((warning) => (
            <li key={warning}>⚠ {warning}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default WindResults;
