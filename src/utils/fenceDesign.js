/**
 * Fence / hoarding wind design engine.
 *
 * Pure functions only, so the same calculation (and its trace) drives the
 * screen, the PDF and the unit tests.
 *
 * Route (BS EN 1991-1-4 + UK NA, BS EN 1991-1-6):
 *   vb  = vb,map · c_dir · c_season · c_prob · c_alt   (NA.2.4, NA.2a)
 *   vb  ≥ vb,min for execution                        (EN 1991-1-6 3.1(5))
 *   qb  = ½ ρ vb²,  ρ = 1.226 kg/m³                   (4.10)
 *   qp  = ce(z) · ce,T · c_orog · qb                   (NA.2.17, Figs NA.7/NA.8)
 *
 * Fence capacities are peak velocity pressures (qp): the system design
 * already includes the net pressure coefficient cp,net, so it is not applied
 * here.
 */

export const ENGINE_VERSION = "2.0.0";

export const RHO_AIR = 1.226;
export const C_DIR = 1.0;
export const VB_MIN_EXECUTION_MS = 20;

/* ---------- programme: return period, c_prob, c_season ---------- */

export const DURATIONS = {
  UNDER_3_DAYS: { label: "Up to 3 days", returnPeriod: 2, seasonMonths: null },
  UNDER_1_MONTH: { label: "Up to 1 month", returnPeriod: 5, seasonMonths: 1 },
  UNDER_2_MONTHS: { label: "Up to 2 months", returnPeriod: 5, seasonMonths: 2 },
  UNDER_3_MONTHS: { label: "Up to 3 months", returnPeriod: 5, seasonMonths: 4 },
  UNDER_4_MONTHS: { label: "Up to 4 months", returnPeriod: 10, seasonMonths: 4 },
  UNDER_6_MONTHS: { label: "Up to 6 months", returnPeriod: 10, seasonMonths: 6 },
  UNDER_A_YEAR: { label: "Up to 1 year", returnPeriod: 10, seasonMonths: null },
  OVER_A_YEAR: { label: "Over 1 year", returnPeriod: 50, seasonMonths: null },
};

/** UK NA Table NA.2 — seasonal factor for a period starting in the given month. */
export const C_SEASON = {
  1: { 1: 0.98, 2: 0.98, 4: 0.98 },
  2: { 1: 0.83, 2: 0.86, 4: 0.87 },
  3: { 1: 0.82, 2: 0.83, 4: 0.83 },
  4: { 1: 0.75, 2: 0.75, 4: 0.76, 6: 0.84 },
  5: { 1: 0.69, 2: 0.71, 4: 0.73 },
  6: { 1: 0.66, 2: 0.67, 4: 0.83 },
  7: { 1: 0.62, 2: 0.71, 4: 0.86 },
  8: { 1: 0.71, 2: 0.82, 4: 0.9 },
  9: { 1: 0.82, 2: 0.85, 4: 0.96 },
  10: { 1: 0.82, 2: 0.89, 4: 1.0, 6: 1.0 },
  11: { 1: 0.88, 2: 0.95, 4: 1.0 },
  12: { 1: 0.94, 2: 1.0, 4: 1.0 },
};

/** EN 1991-1-4 4.2 Note 4 with UK NA values K = 0.2, n = 0.5. */
export const computeCProb = (returnPeriodYears, { K = 0.2, n = 0.5 } = {}) => {
  if (!Number.isFinite(returnPeriodYears) || returnPeriodYears <= 1) return 1;
  const p = 1 / returnPeriodYears;
  const num = 1 - K * Math.log(-Math.log(1 - p));
  const den = 1 - K * Math.log(-Math.log(0.98));
  return Math.pow(num / den, n);
};

export const getDuration = (durationCategory) => DURATIONS[durationCategory] || null;

/**
 * Seasonal factor. A tabulated window is only used where Table NA.2 gives
 * one for that start month; otherwise c_season = 1.0 (conservative).
 */
export const computeCSeason = (installationMonth, durationCategory) => {
  const duration = getDuration(durationCategory);
  if (!duration || !duration.seasonMonths) return 1.0;
  const row = C_SEASON[installationMonth];
  const value = row ? row[duration.seasonMonths] : undefined;
  return Number.isFinite(value) ? value : 1.0;
};

/** UK NA equation NA.2a (z ≤ 10 m) and NA.2b (z > 10 m). */
export const computeCAlt = (altitude_m, z_m) => {
  const A = Number.isFinite(altitude_m) && altitude_m > 0 ? altitude_m : 0;
  if (Number.isFinite(z_m) && z_m > 10) {
    return 1 + 0.001 * A * Math.pow(10 / z_m, 0.2);
  }
  return 1 + 0.001 * A;
};

/* ---------- exposure ---------- */

const TERRAIN_PARAMS = {
  0: { z0: 0.003, zmin: 1 },
  I: { z0: 0.01, zmin: 1 },
  II: { z0: 0.05, zmin: 2 },
  III: { z0: 0.3, zmin: 5 },
};

/** EN 1991-1-4 eq. 4.8 with c_o = 1, k_I = 1. */
export const exposureFactorEN = (z_m, category) => {
  const { z0, zmin } = TERRAIN_PARAMS[category];
  const z = Math.max(z_m, zmin);
  const kr = 0.19 * Math.pow(z0 / 0.05, 0.07);
  const lnTerm = Math.log(z / z0);
  const cr = kr * lnTerm;
  const Iv = 1 / lnTerm;
  return cr * cr * (1 + 7 * Iv);
};

const lerp = (a, b, t) => a + (b - a) * Math.min(Math.max(t, 0), 1);

/**
 * Approximation to UK NA Figure NA.7 (country terrain, h_dis = 0).
 *
 * The NA curves are charts with no closed form, so the EN 1991-1-4 profile
 * is blended by log(distance to sea): open sea (category 0) at ≤ 0.1 km,
 * category I at 2 km and category II from 20 km. Engineers can override ce
 * with a value read from Figure NA.7.
 */
export const exposureFactorCountry = (z_m, distanceToSea_km) => {
  const d = Number.isFinite(distanceToSea_km) ? Math.max(distanceToSea_km, 0) : 0;
  const ce0 = exposureFactorEN(z_m, "0");
  const ceI = exposureFactorEN(z_m, "I");
  const ceII = exposureFactorEN(z_m, "II");
  if (d <= 0.1) return ce0;
  if (d <= 2) return lerp(ce0, ceI, Math.log(d / 0.1) / Math.log(2 / 0.1));
  if (d < 20) return lerp(ceI, ceII, Math.log(d / 2) / Math.log(20 / 2));
  return ceII;
};

/**
 * Approximation to UK NA Figure NA.8 (town correction, ce,T ≤ 1).
 * No reduction within 1 km of the town edge; beyond that the ratio of the
 * EN category III and II profiles.
 */
export const townCorrectionFactor = (z_m, distanceIntoTown_km) => {
  if (!Number.isFinite(distanceIntoTown_km) || distanceIntoTown_km < 1) return 1.0;
  return Math.min(1, exposureFactorEN(z_m, "III") / exposureFactorEN(z_m, "II"));
};

/* ---------- main entry ---------- */

const isNum = (v) => typeof v === "number" && Number.isFinite(v);

/**
 * @param {object} inputs
 * @param {number} inputs.vbMap            vb,map (m/s)
 * @param {number} inputs.altitude_m       site altitude (m AOD)
 * @param {number} inputs.fenceHeight_m
 * @param {number} inputs.installationMonth 1–12
 * @param {string} inputs.durationCategory key of DURATIONS
 * @param {"country"|"town"} inputs.terrain
 * @param {number} inputs.distanceToSea_km
 * @param {number} [inputs.distanceIntoTown_km]
 * @param {number} [inputs.ceOverride]     ce·ce,T read from NA.7/NA.8
 * @param {boolean} [inputs.orographySignificant]
 * @param {number} [inputs.co]             orography factor c_o (≥ 1)
 * @param {boolean} [inputs.combineSeasonAndProb=true]
 * @param {Array} [options]                fence systems { id, name, capacity_kpa, maxHeight_m }
 */
export const designFence = (inputs, options = []) => {
  const errors = [];
  const warnings = [];
  const {
    vbMap,
    altitude_m,
    fenceHeight_m,
    installationMonth,
    durationCategory,
    terrain = "country",
    distanceToSea_km,
    distanceIntoTown_km,
    ceOverride,
    orographySignificant = false,
    co,
    combineSeasonAndProb = true,
  } = inputs || {};

  if (!isNum(vbMap) || vbMap <= 0) errors.push("No basic wind speed vb,map for this site.");
  if (!isNum(altitude_m)) errors.push("Site altitude is required.");
  if (!isNum(fenceHeight_m) || fenceHeight_m <= 0) errors.push("Fence height is required.");
  if (!installationMonth) errors.push("Installation month is required.");
  const duration = getDuration(durationCategory);
  if (!duration) errors.push("Expected duration is required.");
  if (!isNum(ceOverride) && !isNum(distanceToSea_km)) errors.push("Distance to sea is required.");
  if (terrain === "town" && !isNum(ceOverride) && !isNum(distanceIntoTown_km)) {
    errors.push("Distance inside town is required for town terrain.");
  }

  if (errors.length) {
    return { ok: false, errors, warnings, trace: [], options: [] };
  }

  const trace = [];
  const add = (row) => trace.push(row);
  const z = fenceHeight_m;

  add({ symbol: "vb,map", label: "Fundamental basic wind velocity", value: vbMap, unit: "m/s", ref: "UK NA Fig. NA.1" });

  const cDir = C_DIR;
  add({ symbol: "c_dir", label: "Direction factor (all directions)", value: cDir, ref: "UK NA Table NA.1" });

  const cSeasonRaw = computeCSeason(installationMonth, durationCategory);
  const cSeason = combineSeasonAndProb ? cSeasonRaw : 1.0;
  add({
    symbol: "c_season",
    label: duration.seasonMonths
      ? `Season factor (${duration.seasonMonths}-month window)`
      : "Season factor (not applied for this duration)",
    value: cSeason,
    ref: "UK NA Table NA.2",
    note: combineSeasonAndProb ? undefined : "Not combined with c_prob (project setting).",
  });

  const returnPeriod = duration.returnPeriod;
  add({ symbol: "T_R", label: "Return period for execution", value: returnPeriod, unit: "years", ref: "EN 1991-1-6 Table 3.1" });
  if (durationCategory === "UNDER_3_DAYS") {
    warnings.push("A 2-year return period for up to 3 days relies on a reliable weather forecast (EN 1991-1-6 Table 3.1 note).");
  }

  const cProb = computeCProb(returnPeriod);
  add({ symbol: "c_prob", label: "Probability factor (K = 0.2, n = 0.5)", value: cProb, ref: "EN 1991-1-4 4.2 Note 4" });

  const cAlt = computeCAlt(altitude_m, z);
  add({
    symbol: "c_alt",
    label: `Altitude factor (A = ${altitude_m} m)`,
    value: cAlt,
    ref: z > 10 ? "UK NA eq. NA.2b" : "UK NA eq. NA.2a",
  });

  const vbCalc = vbMap * cDir * cSeason * cProb * cAlt;
  add({ symbol: "vb,calc", label: "vb,map · c_dir · c_season · c_prob · c_alt", value: vbCalc, unit: "m/s", ref: "EN 1991-1-4 eq. 4.1; UK NA eq. NA.1" });

  const vbMinGoverns = vbCalc < VB_MIN_EXECUTION_MS;
  const vb = vbMinGoverns ? VB_MIN_EXECUTION_MS : vbCalc;
  add({
    symbol: "vb",
    label: vbMinGoverns ? `Basic wind velocity (minimum ${VB_MIN_EXECUTION_MS} m/s governs)` : "Basic wind velocity",
    value: vb,
    unit: "m/s",
    ref: "EN 1991-1-6 3.1(5)",
  });

  const qb = (0.5 * RHO_AIR * vb * vb) / 1000;
  add({ symbol: "qb", label: "Basic velocity pressure ½ρvb²", value: qb, unit: "kPa", ref: "EN 1991-1-4 eq. 4.10" });

  let ce;
  let ceT = 1;
  let exposureSource;
  if (isNum(ceOverride) && ceOverride > 0) {
    ce = ceOverride;
    exposureSource = "manual";
    add({ symbol: "ce·ce,T", label: "Exposure factor (entered from Figs NA.7/NA.8)", value: ce, ref: "UK NA Figs NA.7, NA.8" });
  } else {
    exposureSource = "approx";
    ce = exposureFactorCountry(z, distanceToSea_km);
    add({
      symbol: "ce(z)",
      label: `Exposure factor, z = ${z} m, ${distanceToSea_km} km to sea`,
      value: ce,
      ref: "UK NA Fig. NA.7 (approx.)",
      note: "EN 1991-1-4 eq. 4.8 profile blended by distance to sea; h_dis = 0.",
    });
    if (terrain === "town") {
      ceT = townCorrectionFactor(z, distanceIntoTown_km);
      add({
        symbol: "ce,T",
        label: `Town correction, ${distanceIntoTown_km} km inside town`,
        value: ceT,
        ref: "UK NA Fig. NA.8 (approx.)",
        note: distanceIntoTown_km < 1 ? "No reduction within 1 km of the town edge." : undefined,
      });
    }
  }

  let cOrog = 1;
  if (orographySignificant) {
    const coValue = isNum(co) && co >= 1 ? co : 1;
    cOrog = coValue * coValue;
    add({
      symbol: "c_o²",
      label: `Orography (c_o = ${coValue.toFixed(2)})`,
      value: cOrog,
      ref: "EN 1991-1-4 4.3.3, Annex A.3",
      note: "Applied as c_o² on qp (conservative).",
    });
    if (!isNum(co) || co <= 1) {
      warnings.push("Orography marked significant but c_o not entered; c_o = 1.0 used.");
    }
  }

  const qp = ce * ceT * cOrog * qb;
  add({ symbol: "qp", label: "Peak velocity pressure", value: qp, unit: "kPa", ref: "UK NA NA.2.17" });

  const checkedOptions = options.map((option) => {
    const heightOk = fenceHeight_m <= option.maxHeight_m;
    const utilisation = isNum(option.capacity_kpa) && option.capacity_kpa > 0 ? qp / option.capacity_kpa : Infinity;
    const pressureOk = utilisation <= 1;
    let reason = "";
    if (!heightOk) reason = `Max height ${option.maxHeight_m.toFixed(1)} m`;
    else if (!pressureOk) reason = `qp exceeds capacity by ${Math.round((utilisation - 1) * 100)}%`;
    return { ...option, utilisation, heightOk, pressureOk, passes: heightOk && pressureOk, reason };
  });

  return {
    ok: true,
    errors,
    warnings,
    engineVersion: ENGINE_VERSION,
    factors: { cDir, cSeason, cSeasonRaw, cProb, cAlt, returnPeriod, vbCalc, vbMinGoverns },
    vb,
    qb,
    ce,
    ceT,
    cOrog,
    exposureSource,
    qp,
    trace,
    options: checkedOptions,
  };
};

/** qp for each start month (for the programme timing chart). */
export const qpByStartMonth = (inputs) =>
  Array.from({ length: 12 }, (_, i) => {
    const result = designFence({ ...inputs, installationMonth: i + 1 });
    return { month: i + 1, qp: result.ok ? result.qp : null, vbMinGoverns: result.ok ? result.factors.vbMinGoverns : false };
  });
