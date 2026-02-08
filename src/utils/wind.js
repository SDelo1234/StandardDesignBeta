/**
 * Wind calculations per BS EN 1991-1-4:2005+A1:2010
 * with UK National Annex (NA to BS EN 1991-1-4:2005+A1:2010).
 */

/* ================================================================== */
/*  Probability factor  cprob  –  UK NA Table NA.2                     */
/* ================================================================== */

export const C_PROB_BY_TR = {
  2: 0.82,
  5: 0.88,
  10: 0.93,
  50: 1.0,
};

/* ================================================================== */
/*  Seasonal factor  cseason  –  UK NA Table NA.1                      */
/* ================================================================== */

export const C_SEASON = {
  1: { m1: 0.98, m2: 0.98, m4: 0.98 },
  2: { m1: 0.83, m2: 0.86, m4: 0.87 },
  3: { m1: 0.82, m2: 0.83, m4: 0.83 },
  4: { m1: 0.75, m2: 0.75, m4: 0.76 },
  5: { m1: 0.69, m2: 0.71, m4: 0.73 },
  6: { m1: 0.66, m2: 0.67, m4: 0.83 },
  7: { m1: 0.62, m2: 0.71, m4: 0.86 },
  8: { m1: 0.71, m2: 0.82, m4: 0.90 },
  9: { m1: 0.82, m2: 0.85, m4: 0.96 },
  10: { m1: 0.82, m2: 0.89, m4: 1.0 },
  11: { m1: 0.88, m2: 0.95, m4: 1.0 },
  12: { m1: 0.94, m2: 1.0, m4: 1.0 },
};

/* ================================================================== */
/*  Directional factor  cdir  –  UK NA default                         */
/* ================================================================== */

export const C_DIR = 1.0;

/* ================================================================== */
/*  Air density  ρ  –  BS EN 1991-1-4 §4.5                            */
/* ================================================================== */

const RHO = 1.226; // kg/m³  (15 °C, sea level)

/* ================================================================== */
/*  Duration ↔ return period / season key mapping                      */
/* ================================================================== */

export const mapDurationToReturnPeriod = (durationCategory) => {
  switch (durationCategory) {
    case "UNDER_3_DAYS":
      return 2;
    case "UNDER_1_MONTH":
    case "UNDER_2_MONTHS":
    case "UNDER_4_MONTHS":
      return 5;
    case "UNDER_A_YEAR":
      return 10;
    case "OVER_A_YEAR":
      return 50;
    default:
      throw new Error(`Unsupported duration category: ${durationCategory}`);
  }
};

export const durationToSeasonKey = (durationCategory) => {
  if (durationCategory === "UNDER_1_MONTH") return "m1";
  if (durationCategory === "UNDER_2_MONTHS") return "m2";
  if (durationCategory === "UNDER_4_MONTHS") return "m4";
  return null;
};

export const deriveWindFactors = ({ installationMonth, durationCategory }) => {
  if (!installationMonth || !durationCategory) {
    throw new Error("Installation month and duration category are required");
  }

  const returnPeriodYears = mapDurationToReturnPeriod(durationCategory);
  const cProb = C_PROB_BY_TR[returnPeriodYears];

  const seasonKey = durationToSeasonKey(durationCategory);
  const seasonRow = C_SEASON[installationMonth];
  const cSeason =
    seasonKey && seasonRow ? seasonRow[seasonKey] : 1.0;

  return {
    returnPeriodYears,
    cProb,
    cSeason,
  };
};

/* ================================================================== */
/*  Altitude factor  calt  –  UK NA Eq NA.2a                           */
/*  calt = 1 + 0.001 × A                                              */
/*  where A = altitude above mean sea level (m)                        */
/* ================================================================== */

export const computeAltitudeFactor = ({ altitude_m = 0 }) => {
  const altitude =
    typeof altitude_m === "number" && Number.isFinite(altitude_m) && altitude_m > 0
      ? altitude_m
      : 0;
  return 1 + 0.001 * altitude;
};

/* ================================================================== */
/*  Basic wind velocity  Vb  –  Eq 4.1                                 */
/*  Vb = cdir × cseason × cprob × calt × Vb,map                      */
/*  Basic velocity pressure  qb  –  Eq 4.10                            */
/*  qb = ½ρVb²                                                        */
/* ================================================================== */

export const computeBasicWind = ({
  vb_map_ms,
  cAlt = 1,
  cDir = C_DIR,
  cSeason = 1,
  cProb = 1,
}) => {
  if (typeof vb_map_ms !== "number" || !Number.isFinite(vb_map_ms)) {
    return null;
  }

  const vb_ms = vb_map_ms * cAlt * cDir * cSeason * cProb;
  const qb_pa = 0.5 * RHO * vb_ms * vb_ms;
  const qb_kpa = qb_pa / 1000;

  return {
    vb_ms,
    qb_pa,
    qb_kpa,
  };
};

/* ================================================================== */
/*  Terrain roughness factor  cr(z)  –  Eq 4.4                        */
/*  kr = 0.19 × (z0 / z0,II)^0.07            (terrain factor)         */
/*  cr(z) = kr × ln(z / z0)      for z ≥ zmin                         */
/*  cr(z) = cr(zmin)              for z < zmin                         */
/*  z0,II = 0.05 m  (terrain category II reference roughness)          */
/* ================================================================== */

const Z0_II = 0.05; // reference roughness length for terrain category II

export const computeRoughnessFactor = ({ z_m, z0_m, zmin_m }) => {
  const z0 = z0_m > 0 ? z0_m : Z0_II;
  const zmin = zmin_m > 0 ? zmin_m : 2;
  const kr = 0.19 * Math.pow(z0 / Z0_II, 0.07);
  const zEff = Math.max(z_m, zmin);
  const cr = kr * Math.log(zEff / z0);
  return { kr, cr, zEff };
};

/* ================================================================== */
/*  Orography factor  co(z)  –  §4.3.3                                 */
/*  Assumed 1.0 for typical flat / gently undulating UK sites.         */
/* ================================================================== */

export const C_OROGRAPHY = 1.0;

/* ================================================================== */
/*  Turbulence intensity  Iv(z)  –  Eq 4.7                             */
/*  Iv(z) = kI / [ co(z) × ln(z / z0) ]                               */
/*  kI = 1.0  (turbulence factor per UK NA)                            */
/* ================================================================== */

const K_I = 1.0;

export const computeTurbulenceIntensity = ({ z_m, z0_m, zmin_m, co = C_OROGRAPHY }) => {
  const z0 = z0_m > 0 ? z0_m : Z0_II;
  const zmin = zmin_m > 0 ? zmin_m : 2;
  const zEff = Math.max(z_m, zmin);
  const Iv = K_I / (co * Math.log(zEff / z0));
  return Iv;
};

/* ================================================================== */
/*  Mean wind velocity  vm(z)  –  Eq 4.3                               */
/*  vm(z) = cr(z) × co(z) × Vb                                        */
/* ================================================================== */

export const computeMeanWindVelocity = ({ cr, co = C_OROGRAPHY, vb_ms }) => {
  return cr * co * vb_ms;
};

/* ================================================================== */
/*  Exposure factor  ce(z)  –  derived from Eq 4.8 / 4.9              */
/*  qp(z) = [1 + 7 × Iv(z)] × ½ρ × vm(z)²  =  ce(z) × qb           */
/*  ce(z) = [1 + 7 × Iv(z)] × cr(z)² × co(z)²                        */
/*  (Note: some references write 2×[1+7Iv]×cr²×co² — these are        */
/*   equivalent when factoring out from the ½ρ term differently.)      */
/* ================================================================== */

export const computeExposureFactor = ({ cr, Iv, co = C_OROGRAPHY }) => {
  return (1 + 7 * Iv) * cr * cr * co * co;
};

/* ================================================================== */
/*  Peak velocity pressure  qp(z)  –  Eq 4.8                           */
/*  qp(z) = ce(z) × qb                                                */
/*  or equivalently:                                                   */
/*  qp(z) = [1 + 7 × Iv(z)] × ½ρ × vm(z)²                            */
/* ================================================================== */

export const computePeakVelocityPressure = ({ ce, qb_kpa }) => {
  return ce * qb_kpa;
};

/* ================================================================== */
/*  Force coefficient  cf  for fences/hoardings  –  §7.4 / Table 7.3  */
/*  Solid (φ = 1.0): cf ≈ 1.2  per Figure 7.23 / Table 7.3            */
/*  This is a conservative value for freestanding walls/hoardings.     */
/* ================================================================== */

export const CF_HOARDING = 1.2;

/* ================================================================== */
/*  Full wind profile calculation                                      */
/*  Computes all BS EN 1991-1-4 parameters for a given height z.       */
/* ================================================================== */

export const computeWindProfile = ({
  vb_ms,
  qb_kpa,
  z_m,
  z0_m,
  zmin_m,
  co = C_OROGRAPHY,
}) => {
  const { kr, cr, zEff } = computeRoughnessFactor({ z_m, z0_m, zmin_m });
  const Iv = computeTurbulenceIntensity({ z_m, z0_m, zmin_m, co });
  const vm = computeMeanWindVelocity({ cr, co, vb_ms });
  const ce = computeExposureFactor({ cr, Iv, co });
  const qp_kpa = computePeakVelocityPressure({ ce, qb_kpa });

  return {
    kr,
    cr,
    co,
    Iv,
    vm_ms: vm,
    ce,
    qp_kpa,
    zEff,
  };
};
