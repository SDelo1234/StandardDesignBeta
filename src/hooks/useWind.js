import { useEffect, useState } from "react";
import { normalisePostcode } from "../utils/postcode";

const ALTITUDE_URL = "/data/Postcode_elevation.csv";
const WIND_URL = "/data/vbpostcode.csv";

const computeFallbackWind = (postcode) => {
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

const findColumnIndex = (headers, tokens, fallback = null) => {
  for (const token of tokens) {
    const index = headers.findIndex((header) => header.includes(token));
    if (index !== -1) {
      return index;
    }
  }
  return fallback;
};

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = value.toString().trim().replace(/[^0-9.+-]+/gu, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
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

const buildAltitudeIndex = (text) => {
  const { headers, rows } = parseCsvFile(text.replace(/^\uFEFF/u, ""));
  if (headers.length === 0) return new Map();
  const normalizedHeaders = headers.map(normaliseHeaderLabel);
  const postcodeIndex = findColumnIndex(normalizedHeaders, ["postcode", "postcodesector", "pc"], 0);
  const altitudeIndex = findColumnIndex(normalizedHeaders, ["altitude", "altitudem", "elevation", "height"], 1);
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

const buildWindIndex = (text) => {
  const { headers, rows } = parseCsvFile(text.replace(/^\uFEFF/u, ""));
  if (headers.length === 0) return new Map();
  const normalizedHeaders = headers.map(normaliseHeaderLabel);
  const postcodeIndex = findColumnIndex(normalizedHeaders, ["postcode", "postcodesector", "pc"], 0);
  const speedIndex = findColumnIndex(normalizedHeaders, ["windspeedms", "windspeed", "basicwindspeed", "designwindspeed", "vb", "vref", "speed"], null);
  const pressureIndex = findColumnIndex(normalizedHeaders, ["windpressure", "pressure", "designpressure", "q"], null);
  const index = new Map();
  rows.forEach((row) => {
    const postcodeRaw = row[postcodeIndex] ?? "";
    const postcode = normalisePostcode(postcodeRaw);
    if (!postcode) return;
    let speedMs = null;
    if (speedIndex !== null) {
      speedMs = convertSpeed(row[speedIndex], normalizedHeaders[speedIndex], headers[speedIndex]);
    }
    let pressureKpa = null;
    if (pressureIndex !== null) {
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

let datasetPromise = null;
let datasetCache = null;

const ensureDatasets = () => {
  if (datasetCache) {
    return Promise.resolve(datasetCache);
  }
  if (!datasetPromise) {
    const fetchDataset = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load dataset: ${url}`);
      }
      const text = await response.text();
      return text;
    };
    datasetPromise = Promise.all([fetchDataset(ALTITUDE_URL), fetchDataset(WIND_URL)])
      .then(([altitudeText, windText]) => {
        const cache = {
          altitudeIndex: buildAltitudeIndex(altitudeText),
          windIndex: buildWindIndex(windText),
        };
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

const lookupDatasets = (datasets, postcode) => {
  const altitudeRecord = findBestRecord(datasets.altitudeIndex, postcode);
  const windRecord = findBestRecord(datasets.windIndex, postcode);
  return {
    altitude: altitudeRecord ? altitudeRecord.altitude : null,
    altitudeMatch: altitudeRecord ? altitudeRecord.original || altitudeRecord.match : null,
    wind: windRecord
      ? {
          speed_ms: windRecord.speed_ms,
          pressure_kpa: windRecord.pressure_kpa,
          source: "dataset",
          match: windRecord.original || windRecord.match,
          matchKey: windRecord.match,
        }
      : null,
  };
};

const initialState = {
  wind: null,
  altitude: null,
  status: datasetCache ? "ready" : "idle",
  error: null,
  sources: { wind: null, altitude: null },
};

const useWind = (postcode) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    const trimmedInput = (postcode || "").trim();
    if (!trimmedInput) {
      setState((prev) => ({
        ...prev,
        wind: null,
        altitude: null,
        status: datasetCache ? "ready" : "idle",
        error: null,
        sources: { wind: null, altitude: null },
      }));
      return;
    }

    const normalized = normalisePostcode(trimmedInput);
    if (!normalized) {
      setState((prev) => ({
        ...prev,
        wind: null,
        altitude: null,
        status: "idle",
        error: null,
        sources: { wind: null, altitude: null },
      }));
      return;
    }

    const fallbackWind = computeFallbackWind(normalized);
    if (!fallbackWind) {
      setState((prev) => ({
        ...prev,
        wind: null,
        altitude: null,
        status: "idle",
        error: null,
        sources: { wind: null, altitude: null },
      }));
      return;
    }

    if (datasetCache) {
      const result = lookupDatasets(datasetCache, normalized);
      const nextWind = result.wind ?? fallbackWind;
      setState({
        wind: nextWind,
        altitude: result.altitude ?? null,
        status: "ready",
        error: null,
        sources: {
          wind: nextWind.source === "dataset" ? nextWind.match : null,
          altitude: result.altitudeMatch ?? null,
        },
      });
      return;
    }

    let cancelled = false;

    setState({
      wind: fallbackWind,
      altitude: null,
      status: "loading",
      error: null,
      sources: {
        wind: fallbackWind.source === "dataset" ? fallbackWind.match : null,
        altitude: null,
      },
    });

    ensureDatasets()
      .then((datasets) => {
        if (cancelled) return;
        const result = lookupDatasets(datasets, normalized);
        const nextWind = result.wind ?? fallbackWind;
        setState({
          wind: nextWind,
          altitude: result.altitude ?? null,
          status: "ready",
          error: null,
          sources: {
            wind: nextWind.source === "dataset" ? nextWind.match : null,
            altitude: result.altitudeMatch ?? null,
          },
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          wind: fallbackWind,
          altitude: null,
          status: "error",
          error,
          sources: {
            wind: fallbackWind.source === "dataset" ? fallbackWind.match : null,
            altitude: null,
          },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [postcode]);

  return state;
};

export default useWind;
