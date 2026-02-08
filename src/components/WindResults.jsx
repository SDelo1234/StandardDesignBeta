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
  const profile = wind.profile;
  const vbValue = factors?.vb_ms ?? wind.speed_ms;
  const qbValue = factors?.qb_kpa ?? wind.pressure_kpa;

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="mb-2 text-lg font-medium">Wind results</h2>
      <p className="mb-4 text-xs text-gray-500">
        Calculated to BS EN 1991-1-4:2005+A1:2010 with UK National Annex
      </p>

      {/* ── Primary results ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Map wind speed (Vb,map)</div>
          <div className="text-2xl font-semibold">{formatWindSpeed(wind.vb_map)}</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Basic wind speed (Vb)</div>
          <div className="text-2xl font-semibold">{formatWindSpeed(vbValue)}</div>
          <div className="mt-1 text-xs text-gray-500">Eq 4.1</div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Basic velocity pressure (qb)</div>
          <div className="text-2xl font-semibold">{formatPressure(qbValue)}</div>
          <div className="mt-1 text-xs text-gray-500">Eq 4.10</div>
        </div>
        {profile && (
          <>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="text-xs text-indigo-600">Peak velocity pressure qp(z)</div>
              <div className="text-2xl font-semibold text-indigo-900">{formatPressure(profile.qp_kpa)}</div>
              <div className="mt-1 text-xs text-indigo-500">Eq 4.8 at z = {profile.zEff} m</div>
            </div>
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <div className="text-xs text-orange-600">Net fence pressure (cf × qp)</div>
              <div className="text-2xl font-semibold text-orange-900">{formatPressure(wind.netPressure_kpa)}</div>
              <div className="mt-1 text-xs text-orange-500">cf = {formatFactor(wind.cf)} (§7.4)</div>
            </div>
          </>
        )}
      </div>

      {/* ── Terrain ── */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 p-4 xl:col-span-2">
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
        {profile && (
          <>
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Mean wind velocity vm(z)</div>
              <div className="text-2xl font-semibold">{formatWindSpeed(profile.vm_ms)}</div>
              <div className="mt-1 text-xs text-gray-500">Eq 4.3</div>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <div className="text-xs text-gray-500">Turbulence intensity Iv(z)</div>
              <div className="text-2xl font-semibold">{formatFactor(profile.Iv)}</div>
              <div className="mt-1 text-xs text-gray-500">Eq 4.7</div>
            </div>
          </>
        )}
      </div>

      {/* ── Factors ── */}
      {factors && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-gray-700">Wind factors</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8">
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="BS EN 1991-1-6 Table 3.1 (actions during execution)"
            >
              <div className="text-xs text-gray-500">Return period (Tr)</div>
              <div className="text-2xl font-semibold">
                {factors.returnPeriodYears ? `${factors.returnPeriodYears} yr` : "–"}
              </div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="UK NA to EN 1991-1-4 Table NA.2"
            >
              <div className="text-xs text-gray-500">cprob</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cProb)}</div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="UK NA to EN 1991-1-4 Table NA.1"
            >
              <div className="text-xs text-gray-500">cseason</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cSeason)}</div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="UK NA to EN 1991-1-4 Eq NA.2a"
            >
              <div className="text-xs text-gray-500">calt</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cAlt)}</div>
            </div>
            <div
              className="rounded-xl border border-gray-200 p-4"
              title="Direction factor — UK NA default"
            >
              <div className="text-xs text-gray-500">cdir</div>
              <div className="text-2xl font-semibold">{formatFactor(factors.cDir)}</div>
            </div>
            {profile && (
              <>
                <div
                  className="rounded-xl border border-gray-200 p-4"
                  title="Roughness factor — Eq 4.4"
                >
                  <div className="text-xs text-gray-500">cr(z)</div>
                  <div className="text-2xl font-semibold">{formatFactor(profile.cr)}</div>
                </div>
                <div
                  className="rounded-xl border border-gray-200 p-4"
                  title="Orography factor — §4.3.3"
                >
                  <div className="text-xs text-gray-500">co(z)</div>
                  <div className="text-2xl font-semibold">{formatFactor(profile.co)}</div>
                </div>
                <div
                  className="rounded-xl border border-gray-200 p-4"
                  title="Exposure factor — Eq 4.9"
                >
                  <div className="text-xs text-gray-500">ce(z)</div>
                  <div className="text-2xl font-semibold">{formatFactor(profile.ce)}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <p className="mt-4 text-xs text-gray-500">{sourceMessage}</p>
    </div>
  );
};

export default WindResults;
