/**
 * Splits data/Postcode_elevation.csv (≈20 MB) into one small JSON
 * file per postcode district, so the browser only downloads the district it
 * needs: public/data/alt/<OUTWARD>.json = { "<INWARD>": altitude_m, ... }.
 *
 * Runs automatically before `npm run dev` and `npm run build`.
 */
import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(__dirname, "../data/Postcode_elevation.csv");
const outDir = path.resolve(__dirname, "../public/data/alt");
const stampFile = path.join(outDir, ".source-mtime");

const isFresh = async () => {
  try {
    const [{ mtimeMs }, stamp] = await Promise.all([stat(source), readFile(stampFile, "utf8")]);
    return String(mtimeMs) === stamp.trim();
  } catch {
    return false;
  }
};

const main = async () => {
  if (await isFresh()) {
    console.log("Altitude shards up to date.");
    return;
  }

  const districts = new Map();
  const rl = readline.createInterface({ input: createReadStream(source), crlfDelay: Infinity });
  let header = true;
  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    const [rawPostcode, rawAltitude] = line.split(",");
    const postcode = (rawPostcode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const altitude = Number(rawAltitude);
    if (postcode.length < 5 || !Number.isFinite(altitude)) continue;
    const outward = postcode.slice(0, -3);
    const inward = postcode.slice(-3);
    if (!districts.has(outward)) districts.set(outward, {});
    districts.get(outward)[inward] = altitude;
  }

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await Promise.all(
    [...districts].map(([outward, entries]) =>
      writeFile(path.join(outDir, `${outward}.json`), JSON.stringify(entries)),
    ),
  );
  const { mtimeMs } = await stat(source);
  await writeFile(stampFile, String(mtimeMs));
  console.log(`Wrote ${districts.size} altitude shards to public/data/alt/`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
