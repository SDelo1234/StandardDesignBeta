import test from "node:test";
import assert from "node:assert/strict";
import {
  VB_MIN_EXECUTION_MS,
  computeCAlt,
  computeCProb,
  computeCSeason,
  designFence,
  exposureFactorCountry,
  exposureFactorEN,
  townCorrectionFactor,
  DURATIONS,
} from "../src/utils/fenceDesign.js";
import { FENCE_SYSTEMS } from "../src/utils/fenceSystems.js";

const close = (actual, expected, tol = 0.001) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected}, got ${actual}`);

test("c_prob follows EN 1991-1-4 4.2 Note 4 with K = 0.2, n = 0.5", () => {
  close(computeCProb(2), 0.776);
  close(computeCProb(5), 0.855);
  close(computeCProb(10), 0.902);
  close(computeCProb(50), 1.0);
});

test("return periods follow EN 1991-1-6 Table 3.1", () => {
  assert.equal(DURATIONS.UNDER_3_DAYS.returnPeriod, 2);
  assert.equal(DURATIONS.UNDER_3_MONTHS.returnPeriod, 5);
  assert.equal(DURATIONS.UNDER_4_MONTHS.returnPeriod, 10);
  assert.equal(DURATIONS.UNDER_A_YEAR.returnPeriod, 10);
  assert.equal(DURATIONS.OVER_A_YEAR.returnPeriod, 50);
});

test("c_season uses UK NA Table NA.2 windows and 1.0 where none is tabulated", () => {
  assert.equal(computeCSeason(7, "UNDER_1_MONTH"), 0.62);
  assert.equal(computeCSeason(2, "UNDER_2_MONTHS"), 0.86);
  assert.equal(computeCSeason(3, "UNDER_3_MONTHS"), 0.83);
  assert.equal(computeCSeason(4, "UNDER_6_MONTHS"), 0.84);
  assert.equal(computeCSeason(5, "UNDER_6_MONTHS"), 1.0);
  assert.equal(computeCSeason(7, "UNDER_A_YEAR"), 1.0);
  assert.equal(computeCSeason(7, "UNDER_3_DAYS"), 1.0);
});

test("c_alt uses NA.2a up to 10 m and NA.2b above", () => {
  close(computeCAlt(100, 2.4), 1.1);
  close(computeCAlt(100, 20), 1 + 0.1 * Math.pow(0.5, 0.2));
  close(computeCAlt(-5, 2), 1.0);
});

test("exposure factor reduces with distance to sea and town correction is ≤ 1", () => {
  close(exposureFactorEN(2.4, "II"), 1.519);
  close(exposureFactorCountry(2.4, 0.05), exposureFactorEN(2.4, "0"));
  close(exposureFactorCountry(2.4, 50), exposureFactorEN(2.4, "II"));
  assert.ok(exposureFactorCountry(2.4, 1) > exposureFactorCountry(2.4, 5));
  assert.equal(townCorrectionFactor(2.4, 0.5), 1);
  assert.ok(townCorrectionFactor(2.4, 2) < 1);
});

const baseInputs = {
  vbMap: 21.6,
  altitude_m: 30,
  fenceHeight_m: 2.4,
  installationMonth: 3,
  durationCategory: "UNDER_4_MONTHS",
  terrain: "country",
  distanceToSea_km: 10,
};

test("20 m/s execution minimum governs low calculated speeds", () => {
  const result = designFence(baseInputs, FENCE_SYSTEMS);
  assert.ok(result.ok);
  assert.ok(result.factors.vbCalc < VB_MIN_EXECUTION_MS);
  assert.equal(result.vb, VB_MIN_EXECUTION_MS);
  assert.ok(result.factors.vbMinGoverns);
  close(result.qb, 0.2452);
});

test("qp = ce · qb and options are checked against qp", () => {
  const result = designFence(baseInputs, FENCE_SYSTEMS);
  close(result.qp, result.ce * result.qb, 1e-9);
  const byId = Object.fromEntries(result.options.map((o) => [o.id, o]));
  assert.equal(byId.A.passes, false);
  assert.equal(byId.A.heightOk, false);
  for (const option of result.options) {
    if (option.heightOk) assert.equal(option.passes, result.qp <= option.capacity_kpa);
  }
});

test("manual exposure factor and orography are applied", () => {
  const manual = designFence({ ...baseInputs, ceOverride: 2 });
  close(manual.qp, 2 * manual.qb, 1e-9);
  const hill = designFence({ ...baseInputs, ceOverride: 2, orographySignificant: true, co: 1.2 });
  close(hill.qp, 2 * 1.44 * hill.qb, 1e-9);
});

test("missing site data stops the calculation instead of guessing", () => {
  const result = designFence({ ...baseInputs, altitude_m: undefined, vbMap: undefined });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("altitude")));
  assert.ok(result.errors.some((e) => e.includes("vb,map")));
});

test("c_season can be switched off", () => {
  const combined = designFence({ ...baseInputs, vbMap: 30 });
  const probOnly = designFence({ ...baseInputs, vbMap: 30, combineSeasonAndProb: false });
  assert.ok(probOnly.vb > combined.vb);
  assert.equal(probOnly.factors.cSeason, 1);
});
