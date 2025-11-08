import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDatasetCache,
  computeFallbackWind,
  lookupDatasets,
} from "../src/utils/datasets.js";
import { formatPostcode, normalisePostcode } from "../src/utils/postcode.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const altitudePath = path.resolve(__dirname, "../public/data/Postcode_elevation.csv");
const windPath = path.resolve(__dirname, "../public/data/vbpostcode.csv");

const loadDatasets = async () => {
  const [altitudeText, windText] = await Promise.all([
    readFile(altitudePath, "utf8"),
    readFile(windPath, "utf8"),
  ]);
  return buildDatasetCache(altitudeText, windText);
};

const formatNumber = (value, fractionDigits = 2) =>
  value === null || value === undefined
    ? "n/a"
    : Number.parseFloat(value).toFixed(fractionDigits);

const main = async () => {
  const [, , ...postcodes] = process.argv;
  if (postcodes.length === 0) {
    console.error("Usage: npm run check:datasets <postcode> [more...]\n");
    console.error("Example: npm run check:datasets \"DA11 9AU\" SW1A1AA");
    process.exitCode = 1;
    return;
  }

  const datasets = await loadDatasets();

  for (const raw of postcodes) {
    const normalised = normalisePostcode(raw);
    if (!normalised) {
      console.log(`✖ ${raw} → invalid postcode`);
      continue;
    }

    const lookup = lookupDatasets(datasets, normalised);
    const fallbackWind = computeFallbackWind(normalised);
    const chosenWind = lookup.wind ?? fallbackWind;

    const formattedPostcode = formatPostcode(normalised);
    const altitudeSource = lookup.altitudeMatch ? `dataset (${lookup.altitudeMatch})` : "fallback";
    const windSource = chosenWind.source === "dataset" ? `dataset (${chosenWind.match})` : "fallback";

    console.log(`\nPostcode: ${formattedPostcode}`);
    console.log(`  Altitude: ${lookup.altitude ?? "n/a"} m [${altitudeSource}]`);
    console.log(
      `  Wind speed: ${formatNumber(chosenWind.speed_ms)} m/s, pressure ${formatNumber(
        chosenWind.pressure_kpa,
      )} kPa [${windSource}]`,
    );

    if (!lookup.wind) {
      console.log("    ↳ Using deterministic fallback wind estimate (dataset match not found).");
    }
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
