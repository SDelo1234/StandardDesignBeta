import { getPostcodeSector, normalisePostcode } from "./postcode.js";

export const ALTITUDE_URL = "/data/Postcode_elevation.csv";
export const WIND_URL = "/data/vbpostcode.csv";

export const computeFallbackWind = (postcode) => {
  const cleaned = normalisePostcode(postcode);
  if (!cleaned) return null;
  const base = 22;
  const codeSum = cleaned.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const speed = Math.round(base + (codeSum % 11));
  const pressureRaw = Number((0.0005 * speed * speed).toFixed(3));
  const pressure_kpa = Math.min(pressureRaw, 0.149);
  const speed_ms = Math.round(Math.sqrt(pressure_kpa / 0.0005));
  return {
    speed_ms,
    pressure_kpa,
    vb_map: speed_ms,
    source: "fallback",
    match: cleaned,
    matchKey: cleaned,
  };
};

const splitCsvLine = (line, delimiter = ",") => {
  const row = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current.trim());
  return row;
};

const parseCsvRow = (line, delimiter = ",") =>
  splitCsvLine(line, delimiter).map((value) =>
    value.replace(/^"(.*)"$/u, "$1").trim(),
  );

const detectDelimiter = (line) => {
  const candidates = [",", ";", "\t", "|"];
  const scores = candidates.map((delimiter) => ({
    delimiter,
    columns: splitCsvLine(line, delimiter).length,
  }));
  const best = scores.reduce(
    (prev, next) => (next.columns > prev.columns ? next : prev),
    { delimiter: ",", columns: 0 },
  );
  return best.columns > 1 ? best.delimiter : ",";
};

const parseCsvFile = (text) => {
  const lines = (text || "")
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  const firstLine = lines.shift();
  const delimiter = detectDelimiter(firstLine);
  const headers = parseCsvRow(firstLine, delimiter);
  const rows = lines.map((line) => parseCsvRow(line, delimiter));
  return { headers, rows };
};

const normaliseHeaderLabel = (header) => header.toLowerCase().replace(/[^a-z0-9]+/gu, "");

const matchHeaderToken = (headers, token, predicate) =>
  headers.findIndex((header) => predicate(header, token));

const findColumnIndex = (headers, tokens, fallback = null) => {
  for (const token of tokens) {
    const index = matchHeaderToken(headers, token, (header, tk) => header === tk);
    if (index !== -1) {
      return { index, strength: "exact", token };
    }
  }

  for (const token of tokens) {
    const index = matchHeaderToken(headers, token, (header, tk) => header.startsWith(tk));
    if (index !== -1) {
      return { index, strength: "prefix", token };
    }
  }

  for (const token of tokens) {
    const index = matchHeaderToken(headers, token, (header, tk) => header.includes(tk));
    if (index !== -1) {
      return { index, strength: "partial", token };
    }
  }

  if (fallback !== null && fallback !== undefined) {
    return { index: fallback, strength: "fallback", token: null };
  }

  return { index: null, strength: null, token: null };
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = value.toString().trim().replace(/[^0-9.+-]+/gu, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const POSTCODE_TOKENS = [
  "postcode",
  "pcds",
  "pcd7",
  "pcd8",
  "pc",
  "postcodesector",
  "postcodearea",
];

const ALTITUDE_TOKENS = [
  "altitude",
  "altitudem",
  "altitudemaod",
  "altitudeaod",
  "altitude_m",
  "altitudemaodm",
  "altitudepaod",
  "altitudevalue",
  "altmaod",
  "altm",
  "maod",
  "aod",
  "elevation",
  "elevationm",
  "groundlevel",
  "height",
  "heightm",
];

const WIND_SPEED_TOKENS = [
  "windspeedms",
  "windspeed",
  "windspeedmps",
  "windspeedm_s",
  "basicwindspeed",
  "designwindspeed",
  "windvb",
  "vbmap",
  "vbms",
  "vbref",
  "vb",
  "vref",
  "speed",
];

const WIND_PRESSURE_TOKENS = [
  "windpressure",
  "designpressure",
  "pressure",
  "pressurekpa",
  "q10",
  "q1",
  "q",
  "kpa",
];

const countValidSamples = (rows, index, isValueValid) => {
  let hits = 0;
  let considered = 0;
  for (let i = 0; i < rows.length && considered < 200; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const value = row[index];
    if (value === undefined || value === null) continue;
    const text = value.toString().trim();
    if (!text) continue;
    considered += 1;
    if (isValueValid(value)) {
      hits += 1;
    }
  }
  return { hits, considered };
};

const looksLikeAltitude = (value) => {
  const str = value.toString().trim();
  const numeric = toNumber(str);
  if (numeric === null) return false;
  if (numeric < -200 || numeric > 2500) return false;
  const units = str.replace(/[-+0-9.,\s]/g, "").toLowerCase();
  if (!units) return true;
  const allowedUnits = ["m", "maod", "aod", "maodm", "maodft", "maodmetres", "maodmeters"];
  return allowedUnits.some((unit) => units.includes(unit));
};

const looksLikeWindSpeed = (value) => {
  const str = value.toString().trim();
  const numeric = toNumber(str);
  if (numeric === null) return false;
  if (numeric <= 0 || numeric > 120) return false;
  const units = str.replace(/[-+0-9.,\s]/g, "").toLowerCase();
  if (!units) return true;
  const allowedUnits = ["mps", "ms", "m\u2212s", "mph", "kmh", "kph", "kn", "kts", "knots"];
  return allowedUnits.some((unit) => units.includes(unit));
};

const looksLikePressure = (value) => {
  const str = value.toString().trim();
  const numeric = toNumber(str);
  if (numeric === null) return false;
  if (numeric <= 0 || numeric > 10) return false;
  const units = str.replace(/[-+0-9.,\s]/g, "").toLowerCase();
  if (!units) return true;
  const allowedUnits = ["kpa", "pa", "nmm2", "nm2", "psf", "psi"];
  return allowedUnits.some((unit) => units.includes(unit));
};

const looksLikePostcode = (value) => {
  const normalised = normalisePostcode(value);
  if (!normalised) return false;
  return /[A-Z]/.test(normalised) && /\d/.test(normalised);
};

const resolveColumnIndex = (normalizedHeaders, tokens, fallback, rows, validator) => {
  const { index, strength } = findColumnIndex(normalizedHeaders, tokens, fallback);
  const hasIndex = index !== null && index !== undefined;

  if (!validator) {
    return hasIndex ? index : null;
  }

  if (hasIndex) {
    if (strength === "exact") {
      return index;
    }

    const { hits, considered } = countValidSamples(rows, index, validator);
    const threshold = strength === "fallback" ? 0 : 0.1;
    if (hits > 0 && (considered === 0 || hits >= Math.max(1, Math.ceil(considered * threshold)))) {
      return index;
    }
  }

  const scores = normalizedHeaders.map((_, idx) => {
    const { hits, considered } = countValidSamples(rows, idx, validator);
    return { index: idx, hits, considered };
  });

  const best = scores
    .filter(({ hits }) => hits > 0)
    .sort((a, b) => {
      if (b.hits !== a.hits) return b.hits - a.hits;
      return a.index - b.index;
    })[0];

  if (best) {
    return best.index;
  }

  return hasIndex ? index : null;
};

const convertSpeed = (value, headerNormalized, headerRaw) => {
  const numeric = toNumber(value);
  if (numeric === null) return null;
  const header = `${headerNormalized} ${headerRaw}`.toLowerCase();
  if (header.includes("mph")) return numeric * 0.44704;
  if (header.includes("kmh") || header.includes("kph")) return numeric / 3.6;
  if (header.includes("knots")) return numeric * 0.514444;
  if (header.includes("ft/s") || header.includes("fts")) return numeric * 0.3048;
  if (header.includes("ftmin")) return numeric * 0.00508;
  if (header.includes("m/s") || header.includes("ms")) return numeric;
  return numeric;
};

const convertPressure = (value, headerNormalized, headerRaw) => {
  const numeric = toNumber(value);
  if (numeric === null) return null;
  const header = `${headerNormalized} ${headerRaw}`.toLowerCase();
  if (header.includes("pa") && !header.includes("kpa")) return numeric / 1000;
  if (header.includes("n/m2") || header.includes("nm2")) return numeric / 1000;
  if (header.includes("psi")) return numeric * 6.89476;
  if (header.includes("psf") || header.includes("lb/ft2")) return numeric * 0.0478803;
  return numeric;
};

export const buildAltitudeIndex = (text) => {
  const { headers, rows } = parseCsvFile(text.replace(/^\uFEFF/u, ""));
  if (headers.length === 0) return new Map();
  const normalizedHeaders = headers.map(normaliseHeaderLabel);
  const postcodeIndex = resolveColumnIndex(
    normalizedHeaders,
    POSTCODE_TOKENS,
    0,
    rows,
    looksLikePostcode,
  );
  const altitudeIndex = resolveColumnIndex(
    normalizedHeaders,
    ALTITUDE_TOKENS,
    null,
    rows,
    looksLikeAltitude,
  );
  if (altitudeIndex === null || altitudeIndex === undefined) {
    return new Map();
  }
  const index = new Map();
  rows.forEach((row) => {
    const postcodeRaw = row[postcodeIndex] ?? "";
    const altitudeRaw = row[altitudeIndex] ?? "";
    const postcode = normalisePostcode(postcodeRaw);
    const altitudeValue = toNumber(altitudeRaw);
    if (!postcode || altitudeValue === null) return;
    const existing = index.get(postcode);
    if (!existing || postcode.length >= existing.key.length) {
      index.set(postcode, {
        altitude: altitudeValue,
        original: postcodeRaw.trim() || postcode,
        key: postcode,
      });
    }
  });
  return index;
};

export const buildWindIndex = (text) => {
  const { headers, rows } = parseCsvFile(text.replace(/^\uFEFF/u, ""));
  if (headers.length === 0) return new Map();
  const normalizedHeaders = headers.map(normaliseHeaderLabel);
  const postcodeIndex = resolveColumnIndex(
    normalizedHeaders,
    POSTCODE_TOKENS,
    0,
    rows,
    looksLikePostcode,
  );
  const speedIndex = resolveColumnIndex(
    normalizedHeaders,
    WIND_SPEED_TOKENS,
    null,
    rows,
    looksLikeWindSpeed,
  );
  const pressureIndex = resolveColumnIndex(
    normalizedHeaders,
    WIND_PRESSURE_TOKENS,
    null,
    rows,
    looksLikePressure,
  );
  const index = new Map();
  rows.forEach((row) => {
    const postcodeRaw = row[postcodeIndex] ?? "";
    const postcode = getPostcodeSector(postcodeRaw);
    if (!postcode) return;
    let speedMs = null;
    if (speedIndex !== null && speedIndex !== undefined) {
      speedMs = convertSpeed(row[speedIndex], normalizedHeaders[speedIndex], headers[speedIndex]);
    }
    let pressureKpa = null;
    if (pressureIndex !== null && pressureIndex !== undefined) {
      pressureKpa = convertPressure(row[pressureIndex], normalizedHeaders[pressureIndex], headers[pressureIndex]);
    }
    if (speedMs === null && pressureKpa === null) return;
    if (speedMs === null && pressureKpa !== null) {
      speedMs = Math.sqrt(pressureKpa / 0.0005);
    }
    if (pressureKpa === null && speedMs !== null) {
      pressureKpa = Number((0.0005 * speedMs * speedMs).toFixed(3));
    }
    if (!Number.isFinite(speedMs) || !Number.isFinite(pressureKpa)) return;
    const existing = index.get(postcode);
    if (!existing || postcode.length >= existing.key.length) {
      index.set(postcode, {
        speed_ms: speedMs,
        pressure_kpa: pressureKpa,
        vb_map: speedMs,
        original: postcodeRaw.trim() || postcode,
        key: postcode,
      });
    }
  });
  return index;
};

const findBestRecord = (map, postcode) => {
  if (!map) return null;
  let cursor = postcode;
  while (cursor.length > 0) {
    const entry = map.get(cursor);
    if (entry) {
      return { ...entry, match: cursor };
    }
    cursor = cursor.slice(0, -1);
  }
  return null;
};

export const lookupDatasets = (datasets, postcode) => {
  const altitudeRecord = findBestRecord(datasets.altitudeIndex, postcode);
  const windPostcode = getPostcodeSector(postcode);
  const windRecord = windPostcode
    ? findBestRecord(datasets.windIndex, windPostcode)
    : null;
  return {
    altitude: altitudeRecord ? altitudeRecord.altitude : null,
    altitudeMatch: altitudeRecord ? altitudeRecord.original || altitudeRecord.match : null,
    wind: windRecord
      ? {
          speed_ms: windRecord.speed_ms,
          pressure_kpa: windRecord.pressure_kpa,
          vb_map: windRecord.vb_map ?? null,
          source: "dataset",
          match: windRecord.original || windRecord.match,
          matchKey: windRecord.match,
        }
      : null,
  };
};

export const buildDatasetCache = (altitudeText, windText) => ({
  altitudeIndex: buildAltitudeIndex(altitudeText),
  windIndex: buildWindIndex(windText),
});

let datasetPromise = null;
let datasetCache = null;

const fetchDataset = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${url}`);
  }
  const text = await response.text();
  return text;
};

export const ensureDatasets = () => {
  if (datasetCache) {
    return Promise.resolve(datasetCache);
  }
  if (!datasetPromise) {
    datasetPromise = Promise.all([fetchDataset(ALTITUDE_URL), fetchDataset(WIND_URL)])
      .then(([altitudeText, windText]) => {
        const cache = buildDatasetCache(altitudeText, windText);
        datasetCache = cache;
        return cache;
      })
      .catch((error) => {
        datasetPromise = null;
        throw error;
      });
  }
  return datasetPromise;
};

export const getDatasetCacheSync = () => datasetCache;

export const clearDatasetCache = () => {
  datasetCache = null;
  datasetPromise = null;
};
