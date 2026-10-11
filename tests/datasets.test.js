import test from "node:test";
import assert from "node:assert/strict";
import { buildWindIndex, lookupAltitudeInShard, lookupWind } from "../src/utils/datasets.js";
import { isValidPostcode } from "../src/utils/postcode.js";

test("altitude: exact postcode, else highest in the sector", () => {
  const shard = { "6QD": 12, "6QE": 15, "6AB": 30, "7XX": 90 };
  assert.deepEqual(lookupAltitudeInShard(shard, "SW4 6QD"), { altitude: 12, match: "SW4 6QD", exact: true });
  const sector = lookupAltitudeInShard(shard, "SW4 6ZZ");
  assert.equal(sector.altitude, 30);
  assert.equal(sector.exact, false);
  assert.equal(lookupAltitudeInShard(shard, "SW4 9ZZ"), null);
  assert.equal(lookupAltitudeInShard(null, "SW4 6QD"), null);
});

test("wind: district match is exact, prefix match is flagged", () => {
  const index = buildWindIndex('postcode,"Vb,map"\nSW4,21.6\nSW1,21.5\n');
  assert.deepEqual(lookupWind(index, "SW4 6QD"), { vb_map: 21.6, match: "SW4", matchKey: "SW4", exact: true });
  const prefix = lookupWind(index, "SW1A 1AA");
  assert.equal(prefix.vb_map, 21.5);
  assert.equal(prefix.exact, false);
  assert.equal(lookupWind(index, "ZZ1 1AA"), null);
});

test("postcode validation", () => {
  assert.ok(isValidPostcode("sw4 6qd"));
  assert.ok(isValidPostcode("SW1A1AA"));
  assert.ok(!isValidPostcode("SW4"));
});
