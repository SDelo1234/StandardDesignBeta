import test from "node:test";
import assert from "node:assert/strict";
import { createDesignBriefPayload, getDesignBriefFileName } from "../src/utils/designBrief.js";
import { designFence } from "../src/utils/fenceDesign.js";
import { FENCE_SYSTEMS } from "../src/utils/fenceSystems.js";

const form = {
  projectName: "Riverside Upgrade",
  requestEmail: "pm@example.com",
  postcode: "sw1a1aa",
  installationMonth: 5,
  durationCategory: "UNDER_4_MONTHS",
  ground: "Hardstanding (concrete/asphalt)",
  height: 2.4,
  terrain: "country",
  altitudeOverride: "",
  orographySignificant: false,
};

const result = designFence(
  {
    vbMap: 24,
    altitude_m: 85,
    fenceHeight_m: 2.4,
    installationMonth: 5,
    durationCategory: "UNDER_4_MONTHS",
    terrain: "country",
    distanceToSea_km: 2.345,
  },
  FENCE_SYSTEMS,
);

test("creates a payload with inputs, outputs and the calculation trace", () => {
  const now = new Date("2024-05-16T10:00:00Z");
  const passing = result.options.filter((o) => o.passes).map((o) => o.id);
  const payload = createDesignBriefPayload({
    form,
    result,
    selectedIds: passing,
    site: {
      altitudeMatch: { altitude: 85, match: "SW1A 1AA", exact: true },
      windMatch: { vb_map: 24, match: "SW1", exact: false },
      distanceToSea_km: 2.345,
    },
    currentDate: now,
  });

  assert.equal(payload.meta.projectName, "Riverside Upgrade");
  assert.equal(payload.meta.postcode, "SW1A 1AA");
  assert.match(payload.meta.generatedLabel, /16 May 2024/);
  assert.equal(payload.inputs.find((row) => row.label === "Month installed").value, "May");
  assert.equal(payload.inputs.find((row) => row.label === "Expected duration").value, "Up to 4 months");
  assert.match(payload.inputs.find((row) => row.label === "Altitude").value, /^85 m AOD/);
  assert.equal(payload.inputs.find((row) => row.label === "Distance to sea").value, "2.3 km (auto, ±5 km)");
  assert.equal(payload.selectedOptions.length, passing.length);
  assert.ok(payload.trace.some((row) => row.symbol === "qp"));
  assert.equal(payload.outputs.find((row) => row.label === "Design pressure qp").value, `${result.qp.toFixed(3)} kPa`);
  assert.ok(payload.limitations.length > 0);
});

test("refuses to build a brief without a completed calculation", () => {
  assert.throws(() => createDesignBriefPayload({ form, result: { ok: false }, selectedIds: [] }));
});

test("produces a stable file name for the generated report", () => {
  const now = new Date("2024-05-16T10:00:00Z");
  assert.equal(getDesignBriefFileName("Riverside Upgrade", now), "DesignBrief_Riverside_Upgrade_2024-05-16.pdf");
});
