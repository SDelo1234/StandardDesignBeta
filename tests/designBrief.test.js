import test from "node:test";
import assert from "node:assert/strict";
import { createDesignBriefPayload, getDesignBriefFileName } from "../src/utils/designBrief.js";

const baseForm = {
  projectName: "Riverside Upgrade",
  postcode: "sw1a1aa",
  installationMonth: 5,
  durationCategory: "UNDER_4_MONTHS",
  ground: "Hardstanding (concrete/asphalt)",
};

const options = [
  { id: "A", name: "Standard panels", capacity_kpa: 0.1234, maxHeight_m: 2 },
  { id: "B", name: "Ballasted panels", capacity_kpa: 0.456, maxHeight_m: 2.4 },
];

const wind = {
  source: "dataset",
  match: "SW1A 1AA",
  pressure_kpa: 0.321,
  speed_ms: 24.5,
  vb_map: 22.8,
  baseWind: {
    pressure_kpa: 0.28,
  },
  terrainCategory: "TC2",
  terrainRoughness_z0_m: 0.05,
  derivedFactors: {
    vb_ms: 24.5,
    qb_kpa: 0.321,
    cProb: 1.12,
    cSeason: 0.95,
    cAlt: 1.03,
    cDir: 0.9,
    returnPeriodYears: 5,
  },
  inputs: {
    distanceToSea_km: 2.345,
    altitude_mAOD: 85.2,
    fenceHeight_m: 2.4,
    terrainCategory: "TC2",
    terrainRoughness_z0_m: 0.05,
  },
};

test("creates a payload that mirrors the UI formatting", () => {
  const now = new Date("2024-05-16T10:00:00Z");
  const payload = createDesignBriefPayload({
    form: baseForm,
    wind,
    options,
    selectedIds: ["A", "B"],
    currentDate: now,
  });

  assert.equal(payload.meta.projectName, "Riverside Upgrade");
  assert.equal(payload.meta.postcode, "SW1A 1AA");
  assert.match(payload.meta.generatedLabel, /16 May 2024/);

  const monthRow = payload.inputs.find((row) => row.label === "Month installed");
  assert.ok(monthRow);
  assert.equal(monthRow.value, "May");

  const durationRow = payload.inputs.find((row) => row.label === "Expected duration");
  assert.ok(durationRow);
  assert.equal(durationRow.value, "Under 4 months");

  const altitudeRow = payload.inputs.find((row) => row.label === "Altitude used");
  assert.ok(altitudeRow);
  assert.equal(altitudeRow.value, "85.2 m AOD");

  assert.deepEqual(
    payload.selectedOptions.map((option) => option.name),
    ["Standard panels", "Ballasted panels"]
  );
  assert.equal(payload.selectedOptions[0].capacity, "0.123 kPa");

  const basicWindRow = payload.outputs.find((row) => row.label === "Basic wind speed (Vb)");
  assert.ok(basicWindRow);
  assert.equal(basicWindRow.value, "24.5 m/s");

  assert.match(payload.windSource, /Derived from postcode wind dataset/);
  assert.ok(payload.notes);
});

test("produces a stable file name for the generated report", () => {
  const now = new Date("2024-05-16T10:00:00Z");
  const fileName = getDesignBriefFileName("Riverside Upgrade", now);
  assert.equal(fileName, "DesignBrief_Riverside_Upgrade_2024-05-16.pdf");
});
