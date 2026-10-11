import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CalcTrace from "../components/CalcTrace";
import FenceElevation from "../components/FenceElevation";
import {
  ExposureSection,
  FenceSection,
  ProgrammeSection,
  ProjectSection,
  SiteDataSection,
} from "../components/FenceInputs";
import FenceOptions from "../components/FenceOptions";
import Map from "../components/Map";
import ProgrammeChart from "../components/ProgrammeChart";
import { Field, Section, inputClass } from "../components/ui";
import WindResults from "../components/WindResults";
import useGeo, { reverseGeocode } from "../hooks/useGeo";
import useWind from "../hooks/useWind";
import { createDesignBriefPayload, generateDesignBriefPdf } from "../utils/designBrief";
import { distanceToCoastKm, polylineLengthM } from "../utils/distanceToCoast";
import { designFence } from "../utils/fenceDesign";
import { FENCE_SYSTEMS, PANEL_WIDTH_M } from "../utils/fenceSystems";
import { formatPressure, formatWindSpeed } from "../utils/formatters";
import { formatPostcode, isValidPostcode, normalisePostcode } from "../utils/postcode";
import { DEFAULT_TERRAIN } from "../utils/terrain";
import { GROUND_OPTIONS } from "../utils/formOptions";

const parseOptionalNumber = (value) => {
  const text = (value ?? "").toString().trim();
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const initialForm = {
  projectName: "",
  requestEmail: "",
  postcode: "",
  installationMonth: null,
  durationCategory: null,
  ground: GROUND_OPTIONS[0],
  height: 2.0,
  terrain: DEFAULT_TERRAIN,
  distanceIntoTown: "",
  vbMapOverride: "",
  altitudeOverride: "",
  distanceToSeaOverride: "",
  ceOverride: "",
  orographySignificant: false,
  co: "",
  combineSeasonAndProb: true,
};

const emailPattern = /^[\w.!#$%&'*+/=?`{|}~-]+@[\w-]+(?:\.[\w-]+)+$/;

const validateField = (key, value) => {
  if (key === "projectName") return value.trim() ? "" : "Project name is required.";
  if (key === "requestEmail") {
    const trimmed = value.trim();
    if (!trimmed) return "Contact email is required.";
    return emailPattern.test(trimmed) ? "" : "Enter a valid email address.";
  }
  if (key === "postcode") return isValidPostcode(value) ? "" : "Enter a valid UK postcode (e.g., SW4 6QD).";
  if (key === "installationMonth") return value ? "" : "Select installation month.";
  if (key === "durationCategory") return value ? "" : "Select expected duration.";
  return "";
};

const FencesPage = () => {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [selected, setSelected] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [location, setLocation] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [fenceLine, setFenceLine] = useState([]);
  const [locating, setLocating] = useState(false);
  const pinnedPostcodeRef = useRef(null);
  const mapRef = useRef(null);

  const { geo, geoError } = useGeo(form.postcode);
  const { wind, windStatus, altitude, altitudeStatus } = useWind(form.postcode);

  const errorFor = useCallback(
    (key) => ((touched[key] || submitAttempted) ? validateField(key, form[key] ?? "") : ""),
    [form, submitAttempted, touched],
  );

  const updateField = useCallback((key, value) => {
    if (key === "postcode") pinnedPostcodeRef.current = null;
    setForm((prev) => ({ ...prev, [key]: key === "postcode" ? value.toUpperCase() : value }));
  }, []);

  const markTouched = useCallback((key) => setTouched((prev) => ({ ...prev, [key]: true })), []);

  // Postcode geocode moves the site location, unless the postcode came from a map pin
  useEffect(() => {
    if (!Number.isFinite(geo.lat) || !Number.isFinite(geo.lon)) return;
    if (pinnedPostcodeRef.current && pinnedPostcodeRef.current === normalisePostcode(form.postcode)) return;
    setLocation({ lat: geo.lat, lon: geo.lon, source: "postcode" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.lat, geo.lon]);

  const handlePick = useCallback(async (lat, lon) => {
    setLocation({ lat, lon, source: "pin" });
    const postcode = await reverseGeocode(lat, lon);
    if (postcode) {
      pinnedPostcodeRef.current = normalisePostcode(postcode);
      setForm((prev) => ({ ...prev, postcode: formatPostcode(postcode) }));
    }
  }, []);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        handlePick(pos.coords.latitude, pos.coords.longitude);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [handlePick]);

  const autoDistance = useMemo(
    () => (location ? distanceToCoastKm(location.lat, location.lon) : null),
    [location],
  );

  const fenceLengthM = useMemo(() => polylineLengthM(fenceLine), [fenceLine]);

  const engineInputs = useMemo(
    () => ({
      vbMap: parseOptionalNumber(form.vbMapOverride) ?? wind?.vb_map,
      altitude_m: parseOptionalNumber(form.altitudeOverride) ?? altitude?.altitude,
      fenceHeight_m: form.height,
      installationMonth: form.installationMonth,
      durationCategory: form.durationCategory,
      terrain: form.terrain,
      distanceToSea_km: parseOptionalNumber(form.distanceToSeaOverride) ?? autoDistance ?? undefined,
      distanceIntoTown_km: parseOptionalNumber(form.distanceIntoTown),
      ceOverride: parseOptionalNumber(form.ceOverride),
      orographySignificant: form.orographySignificant,
      co: parseOptionalNumber(form.co),
      combineSeasonAndProb: form.combineSeasonAndProb,
    }),
    [form, wind, altitude, autoDistance],
  );

  const result = useMemo(() => designFence(engineInputs, FENCE_SYSTEMS), [engineInputs]);

  // Drop selections that no longer pass
  useEffect(() => {
    if (!result.ok) return;
    const passing = new Set(result.options.filter((o) => o.passes).map((o) => o.id));
    setSelected((prev) => {
      const next = prev.filter((id) => passing.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [result]);

  const handleToggle = useCallback((id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const handleExportBrief = useCallback(async () => {
    setSubmitAttempted(true);
    setExportError("");
    const blocking = ["projectName", "requestEmail", "postcode"].filter((key) => validateField(key, form[key]));
    if (blocking.length || !result.ok) {
      setExportError("Complete the highlighted fields before downloading the brief.");
      return;
    }
    setExporting(true);
    try {
      let mapImage = null;
      try {
        mapImage = (await mapRef.current?.captureSnapshot()) ?? null;
      } catch (captureError) {
        console.error("Failed to capture map snapshot", captureError);
      }
      const payload = createDesignBriefPayload({
        form,
        result,
        selectedIds: selected,
        site: {
          windMatch: wind,
          altitudeMatch: altitude,
          vbManual: parseOptionalNumber(form.vbMapOverride) !== undefined,
          altitudeManual: parseOptionalNumber(form.altitudeOverride) !== undefined,
          distanceToSea_km: engineInputs.distanceToSea_km,
          distanceManual: parseOptionalNumber(form.distanceToSeaOverride) !== undefined,
          location,
          fenceLengthM,
        },
      });
      await generateDesignBriefPdf({ payload, mapImage });
    } catch (error) {
      console.error("Failed to export design brief", error);
      setExportError("The design brief could not be created. Please try again.");
    } finally {
      setExporting(false);
    }
  }, [altitude, engineInputs.distanceToSea_km, fenceLengthM, form, location, result, selected, wind]);

  const highlightedOption =
    FENCE_SYSTEMS.find((option) => selected.includes(option.id)) ||
    (result.ok ? result.options.find((option) => option.passes) : null);

  const postcodeError = errorFor("postcode");

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Site-Specific Heras Fencing</h1>
        <p className="text-sm text-gray-600">
          Enter the site details to calculate the design wind pressure and check the standard fence systems.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-6">
          <ProjectSection form={form} errorFor={errorFor} onChange={updateField} onBlur={markTouched} />

          <Section
            step={2}
            title="Site location"
            aside={
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:bg-gray-50"
              >
                {locating ? "Locating…" : "📍 Use my location"}
              </button>
            }
          >
            <Field
              label="Project postcode"
              error={postcodeError || (isValidPostcode(form.postcode) ? geoError : "")}
              help={geo.displayName || "Or click the map to place the site."}
              className="mb-4 max-w-xs"
            >
              {(props) => (
                <input
                  {...props}
                  className={`${inputClass(postcodeError)} uppercase`}
                  placeholder="SW4 6QD"
                  autoComplete="postal-code"
                  value={form.postcode}
                  onChange={(e) => updateField("postcode", e.target.value)}
                  onBlur={() => markTouched("postcode")}
                />
              )}
            </Field>
            <Map
              ref={mapRef}
              location={location}
              onPick={handlePick}
              drawing={drawing}
              fenceLine={fenceLine}
              onFenceLineChange={setFenceLine}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => setDrawing((value) => !value)}
                className={`rounded-xl px-3 py-2 shadow-sm ${
                  drawing ? "bg-[var(--mwp-navy)] text-white" : "border border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                {drawing ? "Finish fence line" : "Draw fence line"}
              </button>
              <button
                type="button"
                onClick={() => setFenceLine((prev) => prev.slice(0, -1))}
                disabled={!fenceLine.length}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Undo point
              </button>
              <button
                type="button"
                onClick={() => setFenceLine([])}
                disabled={!fenceLine.length}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 shadow-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Clear
              </button>
              <span className="text-gray-600">
                {drawing
                  ? "Click along the fence route to add points."
                  : fenceLengthM > 0
                  ? `Fence length ${Math.round(fenceLengthM)} m ≈ ${Math.ceil(fenceLengthM / PANEL_WIDTH_M)} panels at ${PANEL_WIDTH_M} m`
                  : "Click the map or drag the pin to set the exact site location."}
              </span>
            </div>
          </Section>

          <SiteDataSection
            form={form}
            onChange={updateField}
            wind={wind}
            windStatus={windStatus}
            altitude={altitude}
            altitudeStatus={altitudeStatus}
            autoDistance={autoDistance}
            locationSource={location?.source}
          />
          <ExposureSection form={form} onChange={updateField} />
          <ProgrammeSection form={form} errorFor={errorFor} onChange={updateField} onBlur={markTouched} />
          <FenceSection form={form} onChange={updateField} />

          {result.ok ? (
            <section className="space-y-6" aria-live="polite">
              <WindResults result={result} />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FenceElevation height={form.height} qp={result.qp} option={highlightedOption} />
                <ProgrammeChart inputs={engineInputs} selectedMonth={form.installationMonth} />
              </div>
              <CalcTrace result={result} />
              <FenceOptions
                result={result}
                selected={selected}
                onToggle={handleToggle}
                onExportBrief={handleExportBrief}
                exporting={exporting}
                exportError={exportError}
              />
            </section>
          ) : (
            <section className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-700">
              <h2 className="mb-2 text-lg font-medium">Results</h2>
              <p className="mb-2">To calculate the design pressure, the tool still needs:</p>
              <ul className="list-disc space-y-1 pl-5">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">Site</dt>
                <dd className="text-right font-medium">{formatPostcode(form.postcode) || "–"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">vb</dt>
                <dd className="font-medium tabular-nums">{result.ok ? formatWindSpeed(result.vb) : "–"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">qp</dt>
                <dd className="text-lg font-semibold tabular-nums">{result.ok ? formatPressure(result.qp) : "–"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-gray-600">Suitable systems</dt>
                <dd className="font-medium">
                  {result.ok ? result.options.filter((o) => o.passes).map((o) => o.id).join(", ") || "None" : "–"}
                </dd>
              </div>
              {fenceLengthM > 0 && (
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-600">Fence length</dt>
                  <dd className="font-medium">{Math.round(fenceLengthM)} m</dd>
                </div>
              )}
            </dl>
            {!result.ok && (
              <p className="mt-3 text-xs text-gray-500">{result.errors.length} item(s) still needed.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FencesPage;
