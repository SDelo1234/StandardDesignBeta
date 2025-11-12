import React, { useCallback, useEffect, useMemo, useState } from "react";
import FenceInputs from "../components/FenceInputs";
import FenceOptions from "../components/FenceOptions";
import Map from "../components/Map";
import WindResults from "../components/WindResults";
import useWind from "../hooks/useWind";
import { DEFAULT_TERRAIN_CATEGORY, Z0_BY_TERRAIN } from "../utils/terrain";
import {
  deriveWindFactors,
  computeAltitudeFactor,
  computeBasicWind,
  C_DIR,
} from "../utils/wind";

const IMG1 = "https://i.ibb.co/LzMWRbqj/IMG1-fence-1.jpg";
const IMG2 = "https://i.ibb.co/Kc61kkHd/IMG2-fence-2.jpg";
const IMG3 = "https://i.ibb.co/VYkkBwWW/IMG3-fence-3.jpg";
const IMG4 = "https://i.ibb.co/pBCs5YHd/IMG4-fence-4.jpg";

const parseOptionalNumber = (value) => {
  if (value === null || value === undefined) return undefined;
  const text = value.toString().trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const initialForm = {
  projectName: "",
  postcode: "",
  installationMonth: null,
  durationCategory: null,
  ground: "Hardstanding (concrete/asphalt)",
  height: "2.0 m",
  distanceToSea: "",
  altitude: "",
  altitudeOverride: "",
  terrainCategory: DEFAULT_TERRAIN_CATEGORY,
  terrainRoughness_z0_m: Z0_BY_TERRAIN[DEFAULT_TERRAIN_CATEGORY],
};

const postcodeRegex = /^\s*[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}\s*$/i;

const FencesPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState([]);

  const {
    wind,
    altitude: autoAltitude,
    status: lookupStatus,
    sources: datasetSources,
  } = useWind(form.postcode);

  const overrideAltitude = useMemo(() => {
    const raw = (form.altitudeOverride || "").trim();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [form.altitudeOverride]);

  const effectiveAltitude = useMemo(() => {
    if (overrideAltitude !== null) {
      return overrideAltitude;
    }
    if (autoAltitude === null || autoAltitude === undefined) {
      return null;
    }
    return autoAltitude;
  }, [overrideAltitude, autoAltitude]);

  useEffect(() => {
    setForm((prev) => {
      const nextAltitude =
        effectiveAltitude === null || effectiveAltitude === undefined
          ? ""
          : String(effectiveAltitude);
      if (prev.altitude === nextAltitude) {
        return prev;
      }
      return { ...prev, altitude: nextAltitude };
    });
  }, [effectiveAltitude]);

  const options = useMemo(
    () => [
      { id: "A", name: "2.0 m panels @ 3.5 m centres", capacity_kpa: 0.1, maxHeight_m: 2.0, img: IMG3 },
      { id: "B", name: "2.0 m panels + rear brace/ballast", capacity_kpa: 0.2, maxHeight_m: 2.0, img: IMG2 },
      { id: "C", name: "2.4 m hoarding with buttress @ 2.4 m", capacity_kpa: 0.3, maxHeight_m: 2.4, img: IMG1 },
      { id: "D", name: "2.4 m mesh with rear braces @ 2.4 m", capacity_kpa: 0.3, maxHeight_m: 2.4, img: IMG2 },
      { id: "E", name: "2.4 m hoarding + heavy ballast", capacity_kpa: 0.4, maxHeight_m: 2.4, img: IMG1 },
      { id: "F", name: "3.0 m hoarding with twin buttress", capacity_kpa: 0.5, maxHeight_m: 3.0, img: IMG4 },
    ],
    []
  );

  const requiredHeight = useMemo(() => parseFloat(form.height), [form.height]);

  const validateField = useCallback((key, value) => {
    if (key === "projectName") {
      return value.trim() ? "" : "Project name is required.";
    }
    if (key === "postcode") {
      return postcodeRegex.test(value.trim()) ? "" : "Enter a valid UK postcode (e.g., SW4 6QD).";
    }
    if (key === "terrainCategory") {
      return value ? "" : "Select a terrain category.";
    }
    if (key === "installationMonth") {
      return value ? "" : "Select installation month.";
    }
    if (key === "durationCategory") {
      return value ? "" : "Select expected duration.";
    }
    return "";
  }, []);

  const updateField = useCallback((key, value) => {
    const nextValue = key === "postcode" ? value.toUpperCase() : value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
    const message = validateField(key, nextValue);
    setErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[key] = message;
      } else {
        delete next[key];
      }
      return next;
    });
  }, [validateField]);

  const handleTerrainCategoryChange = useCallback((categoryId) => {
    const fallbackId = DEFAULT_TERRAIN_CATEGORY;
    const nextId =
      categoryId && Object.prototype.hasOwnProperty.call(Z0_BY_TERRAIN, categoryId)
        ? categoryId
        : fallbackId;
    const roughness = Z0_BY_TERRAIN[nextId];
    setForm((prev) => ({
      ...prev,
      terrainCategory: nextId,
      terrainRoughness_z0_m: roughness,
    }));
    setErrors((prev) => {
      const next = { ...prev };
      if (nextId) {
        delete next.terrainCategory;
      } else {
        next.terrainCategory = "Select a terrain category.";
      }
      return next;
    });
  }, []);

  const handleToggle = useCallback((id, disabled) => {
    if (disabled) return;
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const windInputs = useMemo(() => {
    const terrainCategory = form.terrainCategory || DEFAULT_TERRAIN_CATEGORY;
    const terrainRoughness =
      form.terrainRoughness_z0_m ?? Z0_BY_TERRAIN[terrainCategory];
    return {
      postcode: form.postcode.trim(),
      distanceToSea_km: parseOptionalNumber(form.distanceToSea),
      altitude_mAOD:
        effectiveAltitude === null || effectiveAltitude === undefined
          ? undefined
          : Number(effectiveAltitude),
      fenceHeight_m: requiredHeight,
      terrainCategory,
      terrainRoughness_z0_m: terrainRoughness,
      installationMonth: form.installationMonth,
      durationCategory: form.durationCategory,
    };
  }, [
    effectiveAltitude,
    form.distanceToSea,
    form.durationCategory,
    form.installationMonth,
    form.postcode,
    form.terrainCategory,
    form.terrainRoughness_z0_m,
    requiredHeight,
  ]);

  useEffect(() => {
    setErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      const requiresMeta = Boolean(wind);

      if (requiresMeta && !form.installationMonth) {
        if (next.installationMonth !== "Select installation month.") {
          next.installationMonth = "Select installation month.";
          changed = true;
        }
      } else if (next.installationMonth) {
        delete next.installationMonth;
        changed = true;
      }

      if (requiresMeta && !form.durationCategory) {
        if (next.durationCategory !== "Select expected duration.") {
          next.durationCategory = "Select expected duration.";
          changed = true;
        }
      } else if (next.durationCategory) {
        delete next.durationCategory;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [wind, form.installationMonth, form.durationCategory]);

  const derivedFactors = useMemo(() => {
    if (!form.installationMonth || !form.durationCategory) {
      return null;
    }

    const baseFactors = deriveWindFactors({
      installationMonth: form.installationMonth,
      durationCategory: form.durationCategory,
    });

    const altitudeValue =
      typeof effectiveAltitude === "number" && Number.isFinite(effectiveAltitude)
        ? effectiveAltitude
        : 0;
    const referenceHeight =
      typeof requiredHeight === "number" && Number.isFinite(requiredHeight) && requiredHeight > 0
        ? requiredHeight
        : 10;

    const cAlt = computeAltitudeFactor({
      altitude_m: altitudeValue,
      referenceHeight_m: referenceHeight,
    });

    return {
      ...baseFactors,
      cAlt,
      cDir: C_DIR,
    };
  }, [
    form.installationMonth,
    form.durationCategory,
    effectiveAltitude,
    requiredHeight,
  ]);

  const windWithTerrain = useMemo(() => {
    if (!wind || !derivedFactors) return null;

    const baseSpeed = Number.isFinite(wind.vb_map)
      ? wind.vb_map
      : Number.isFinite(wind.speed_ms)
      ? wind.speed_ms
      : null;

    if (!Number.isFinite(baseSpeed) || baseSpeed === null) {
      return null;
    }

    const basePressurePa = 0.613 * baseSpeed * baseSpeed;
    const basePressureKpa = basePressurePa / 1000;

    const basicWind = computeBasicWind({
      vb_map_ms: baseSpeed,
      cAlt: derivedFactors.cAlt,
      cDir: derivedFactors.cDir,
      cSeason: derivedFactors.cSeason,
      cProb: derivedFactors.cProb,
    });

    if (!basicWind) {
      return null;
    }

    return {
      ...wind,
      baseWind: {
        speed_ms: wind.speed_ms,
        pressure_kpa: basePressureKpa,
        vb_map_ms: baseSpeed,
      },
      speed_ms: basicWind.vb_ms,
      pressure_kpa: basicWind.qb_kpa,
      vb_map: baseSpeed,
      derivedFactors: {
        ...derivedFactors,
        vb_ms: basicWind.vb_ms,
        qb_kpa: basicWind.qb_kpa,
      },
      terrainCategory: windInputs.terrainCategory,
      terrainRoughness_z0_m: windInputs.terrainRoughness_z0_m,
      inputs: windInputs,
    };
  }, [wind, derivedFactors, windInputs]);

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Site-Specific Heras Fencing – Quick Setup</h1>
        <p className="text-sm text-gray-600">
          Enter basic details to generate site-specific designs and a calculation pack.
        </p>
      </header>

      <Map postcode={form.postcode} onPostcodeChange={(value) => updateField("postcode", value)} />
      <FenceInputs
        form={form}
        errors={errors}
        onChange={updateField}
        autoAltitude={autoAltitude}
        altitudeStatus={lookupStatus}
        altitudeOverride={form.altitudeOverride}
        onAltitudeOverrideChange={(value) => updateField("altitudeOverride", value)}
        effectiveAltitude={effectiveAltitude}
        altitudeMatch={datasetSources.altitude}
        onTerrainChange={handleTerrainCategoryChange}
      />

      {windWithTerrain && (
        <section className="mt-8 space-y-6">
          <WindResults wind={windWithTerrain} />
          <FenceOptions
            options={options}
            selected={selected}
            wind={windWithTerrain}
            requiredHeight={requiredHeight}
            onToggle={handleToggle}
          />
        </section>
      )}
    </div>
  );
};

export default FencesPage;
