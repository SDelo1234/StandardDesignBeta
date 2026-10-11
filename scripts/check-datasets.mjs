import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWindIndex, lookupAltitudeInShard, lookupWind } from "../src/utils/datasets.js";
import { formatPostcode, isValidPostcode, normalisePostcode } from "../src/utils/postcode.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const windPath = path.resolve(__dirname, "../public/data/vbpostcode.csv");
const shardDir = path.resolve(__dirname, "../public/data/alt");

const loadShard = async (outward) => {
  try {
    return JSON.parse(await readFile(path.join(shardDir, `${outward}.json`), "utf8"));
  } catch {
    return null;
  }
};

const main = async () => {
  const [, , ...postcodes] = process.argv;
  if (postcodes.length === 0) {
    console.error("Usage: npm run check:datasets <postcode> [more...]\n");
    console.error('Example: npm run check:datasets "DA11 9AU" SW1A1AA');
    process.exitCode = 1;
    return;
  }

  const windIndex = buildWindIndex(await readFile(windPath, "utf8"));

  for (const raw of postcodes) {
    const normalised = normalisePostcode(raw);
    if (!isValidPostcode(normalised)) {
      console.log(`✖ ${raw} → invalid postcode`);
      continue;
    }
    const wind = lookupWind(windIndex, normalised);
    const altitude = lookupAltitudeInShard(await loadShard(normalised.slice(0, -3)), normalised);

    console.log(`\nPostcode: ${formatPostcode(normalised)}`);
    console.log(
      wind
        ? `  vb,map: ${wind.vb_map.toFixed(1)} m/s [${wind.exact ? "district" : "nearest prefix"} ${wind.match}]`
        : "  vb,map: no dataset match – must be entered manually",
    );
    console.log(
      altitude
        ? `  Altitude: ${altitude.altitude} m AOD [${altitude.match}]`
        : "  Altitude: no dataset match – must be entered manually",
    );
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
