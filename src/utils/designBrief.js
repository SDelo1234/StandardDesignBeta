import { formatPostcode } from "./postcode.js";
import { getTerrainOption } from "./terrain.js";
import {
  formatAltitudeValue,
  formatFactor,
  formatPressure,
  formatRoughness,
  formatWindSpeed,
} from "./formatters.js";
import { MONTH_LABELS, getDurationLabel } from "./formOptions.js";

const BROWNE_LOGO_URL = "https://browne.co.uk/wp-content/themes/browne/images/logo_footer.jpg";

const FOOTER_NOTE =
  "Mock only – would download drawings and calcs with title blocks populated.";

const SOURCE_MESSAGES = {
  dataset: (match) =>
    `Derived from postcode wind dataset (${formatPostcode(match) || "unknown match"})`,
  fallback: () => "Estimated using fallback rules (no dataset match)",
};

const ensureValue = (value) => (value === null || value === undefined || value === "" ? "–" : value);

const logoDataUrlCache = {};

const getDataUrlForImage = async (url) => {
  if (!url) return null;
  if (logoDataUrlCache[url]) return logoDataUrlCache[url];

  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const blob = await response.blob();
    const reader = new FileReader();
    const dataUrlPromise = new Promise((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(blob);
    const dataUrl = await dataUrlPromise;
    logoDataUrlCache[url] = dataUrl;
    return dataUrl;
  } catch (error) {
    console.error("Failed to load image for PDF", error);
    return null;
  }
};

const formatDateLabel = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatFileDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const sanitizeFilePart = (text) => {
  if (!text) return "";
  return text
    .toString()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
};

export const getDesignBriefFileName = (projectName, generatedAt) => {
  const safeName = sanitizeFilePart(projectName) || "Project";
  const datePart = formatFileDate(generatedAt) || "Date";
  return `DesignBrief_${safeName}_${datePart}.pdf`;
};

const createSelectedOptionsSummary = (options, selectedIds) =>
  options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => ({
      id: option.id,
      name: option.name,
      capacity: formatPressure(option.capacity_kpa),
      maxHeight: Number.isFinite(option.maxHeight_m)
        ? `${option.maxHeight_m.toFixed(1)} m`
        : "–",
    }));

const describeWindSource = (wind) => {
  if (!wind) return "";
  if (wind.source === "dataset") {
    return SOURCE_MESSAGES.dataset(wind.match);
  }
  return SOURCE_MESSAGES.fallback();
};

let jsPdfPromise = null;

const ensureJsPdf = () => {
  if (window.jspdf && window.jspdf.jsPDF) {
    return Promise.resolve(window.jspdf.jsPDF);
  }

  if (jsPdfPromise) {
    return jsPdfPromise;
  }

  jsPdfPromise = new Promise((resolve, reject) => {
    const scriptId = "jspdf-js";
    const existing = document.getElementById(scriptId);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.jspdf && window.jspdf.jsPDF));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
    script.onload = () => resolve(window.jspdf && window.jspdf.jsPDF);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return jsPdfPromise;
};

export const createDesignBriefPayload = ({
  form,
  wind,
  options,
  selectedIds,
  currentDate = new Date(),
}) => {
  if (!wind) {
    throw new Error("Wind data is required to create the design brief payload.");
  }

  const selectedOptions = createSelectedOptionsSummary(options, selectedIds);
  const windInputs = wind.inputs || {};
  const terrainOption = getTerrainOption(wind.terrainCategory);
  const terrainLabel = terrainOption ? terrainOption.title : wind.terrainCategory || "–";

  const monthLabel =
    typeof form.installationMonth === "number"
      ? MONTH_LABELS[form.installationMonth - 1] || "–"
      : "–";
  const durationLabel = getDurationLabel(form.durationCategory) || "–";

  const inputs = [
    { label: "Project name", value: ensureValue((form.projectName || "").trim()) },
    {
      label: "Project postcode",
      value: formatPostcode((form.postcode || "").trim()) || "–",
    },
    { label: "Month installed", value: monthLabel },
    { label: "Expected duration", value: durationLabel },
    { label: "Ground conditions", value: ensureValue(form.ground) },
    {
      label: "Terrain category",
      value: terrainLabel,
    },
    {
      label: "Distance to sea",
      value: Number.isFinite(windInputs.distanceToSea_km)
        ? `${windInputs.distanceToSea_km.toFixed(1)} km`
        : "–",
    },
    {
      label: "Altitude used",
      value: formatAltitudeValue(windInputs.altitude_mAOD) || "–",
    },
    {
      label: "Fence height",
      value: Number.isFinite(windInputs.fenceHeight_m)
        ? `${windInputs.fenceHeight_m.toFixed(1)} m`
        : "–",
    },
  ];

  const factors = wind.derivedFactors || {};
  const outputs = [
    {
      label: "Basic wind speed (Vb)",
      value: formatWindSpeed(factors.vb_ms ?? wind.speed_ms),
    },
    {
      label: "Basic wind pressure (qb)",
      value: formatPressure(factors.qb_kpa ?? wind.pressure_kpa),
    },
    {
      label: "Map wind speed (Vb,map)",
      value: formatWindSpeed(wind.vb_map),
    },
    {
      label: "Map wind pressure (qb,map)",
      value: formatPressure(wind.baseWind?.pressure_kpa),
    },
    {
      label: "Surface roughness z₀",
      value: formatRoughness(wind.terrainRoughness_z0_m),
    },
    { label: "C_prob", value: formatFactor(factors.cProb) },
    { label: "C_season", value: formatFactor(factors.cSeason) },
    { label: "C_alt", value: formatFactor(factors.cAlt) },
    { label: "C_dir", value: formatFactor(factors.cDir) },
    {
      label: "Return period",
      value: factors.returnPeriodYears ? `${factors.returnPeriodYears} years` : "–",
    },
  ];

  const meta = {
    projectName: (form.projectName || "").trim(),
    postcode: formatPostcode((form.postcode || "").trim()),
    generatedAt: currentDate,
    generatedLabel: formatDateLabel(currentDate),
  };

  return {
    meta,
    selectedOptions,
    inputs,
    outputs,
    terrain: {
      label: terrainLabel,
      description: terrainOption?.desc || "",
    },
    windSource: describeWindSource(wind),
    notes: FOOTER_NOTE,
  };
};

const drawTable = (doc, { title, rows, startY, margin, pageWidth }) => {
  let y = startY;
  const labelWidth = 180;
  const valueWidth = pageWidth - margin * 2 - labelWidth;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title, margin, y);
  y += 10;

  doc.setDrawColor(210);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  rows.forEach((row) => {
    const labelLines = doc.splitTextToSize(ensureValue(row.label), labelWidth);
    const valueLines = doc.splitTextToSize(ensureValue(row.value), valueWidth);
    const lineCount = Math.max(labelLines.length, valueLines.length);
    const rowHeight = lineCount * 12 + 4;

    doc.text(labelLines, margin, y + 12);
    doc.text(valueLines, margin + labelWidth, y + 12);
    doc.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);

    y += rowHeight + 2;
  });

  return y + 6;
};

export const generateDesignBriefPdf = async ({ payload, mapImage }) => {
  const JsPDF = await ensureJsPdf();
  if (!JsPDF) {
    throw new Error("Could not load PDF generator.");
  }

  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const { meta } = payload;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(meta.projectName || "Design brief", margin, margin + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Postcode: ${meta.postcode || "–"}`, margin, margin + 32);
  if (meta.generatedLabel) {
    doc.text(`Generated: ${meta.generatedLabel}`, margin, margin + 48);
  }

  const logoDataUrl = await getDataUrlForImage(BROWNE_LOGO_URL);
  if (logoDataUrl) {
    const logoWidth = 120;
    const logoHeight = 40;
    doc.addImage(logoDataUrl, "JPEG", pageWidth - margin - logoWidth, margin, logoWidth, logoHeight);
  }

  let y = margin + 70;

  if (payload.selectedOptions.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Selected fence options", margin, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    payload.selectedOptions.forEach((option) => {
      const line = `${option.name} (${option.capacity} · max height ${option.maxHeight})`;
      const textLines = doc.splitTextToSize(line, pageWidth - margin * 2);
      doc.text(textLines, margin, y + 10);
      y += textLines.length * 12;
    });
    y += 12;
  }

  if (mapImage) {
    const mapSize = Math.min(pageWidth - margin * 2, 260);
    doc.addImage(mapImage, "PNG", margin, y, mapSize, mapSize);
    y += mapSize + 16;
  }

  y = drawTable(doc, {
    title: "Inputs",
    rows: payload.inputs,
    startY: y,
    margin,
    pageWidth,
  });

  y = drawTable(doc, {
    title: "Wind outputs",
    rows: payload.outputs,
    startY: y,
    margin,
    pageWidth,
  });

  if (payload.windSource) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    const sourceLines = doc.splitTextToSize(payload.windSource, pageWidth - margin * 2);
    doc.text(sourceLines, margin, y + 10);
    y += sourceLines.length * 12 + 8;
  }

  if (payload.terrain.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const terrainLines = doc.splitTextToSize(payload.terrain.description, pageWidth - margin * 2);
    doc.text(terrainLines, margin, y + 8);
    y += terrainLines.length * 12 + 4;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  const footerLines = doc.splitTextToSize(payload.notes, pageWidth - margin * 2);
  const footerY = pageHeight - margin / 2;
  doc.text(footerLines, margin, footerY);

  const fileName = getDesignBriefFileName(meta.projectName, meta.generatedAt);
  doc.save(fileName);

  return fileName;
};
