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

const createBrowneLogoFallback = () => {
  if (logoDataUrlCache.__browneFallback) {
    return logoDataUrlCache.__browneFallback;
  }

  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#003A5D";
  ctx.font = "bold 120px 'Helvetica Neue', Arial, sans-serif";
  ctx.textBaseline = "middle";
  ctx.fillText("BROWNE", 30, canvas.height / 2 + 10);

  ctx.fillStyle = "#8DC63F";
  ctx.fillRect(32, canvas.height - 48, 220, 14);

  const dataUrl = canvas.toDataURL("image/png");
  logoDataUrlCache.__browneFallback = dataUrl;
  return dataUrl;
};

const getDataUrlForImage = async (url, fallbackFactory) => {
  if (url && logoDataUrlCache[url]) {
    return logoDataUrlCache[url];
  }

  if (url) {
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
    }
  }

  if (fallbackFactory) {
    const fallback = await fallbackFactory();
    if (fallback) {
      if (url) {
        logoDataUrlCache[url] = fallback;
      }
      return fallback;
    }
  }

  return null;
};

const inferImageFormat = (dataUrl) => {
  if (typeof dataUrl !== "string") return "PNG";
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) {
    return "JPEG";
  }
  return "PNG";
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

const SECTION_GAP = 28;

const drawTableCard = (doc, { title, rows, startY, margin, pageWidth }) => {
  const cardPadding = 24;
  const contentWidth = pageWidth - margin * 2;
  const tableWidth = contentWidth - cardPadding * 2;
  const labelColumnWidth = 190;
  const columnGap = 20;
  const valueColumnWidth = tableWidth - labelColumnWidth - columnGap;
  const rowPadding = 12;
  const lineHeight = 16;
  const rowSpacing = 8;

  const measurements = rows.map((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const labelLines = doc.splitTextToSize(ensureValue(row.label), labelColumnWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const valueLines = doc.splitTextToSize(ensureValue(row.value), valueColumnWidth);
    const contentLines = Math.max(labelLines.length, valueLines.length);
    const height = contentLines * lineHeight + rowPadding * 2;
    return { labelLines, valueLines, height };
  });

  const bodyHeight = measurements.reduce(
    (total, row, index) => total + row.height + (index < measurements.length - 1 ? rowSpacing : 0),
    0
  );
  const cardHeight = cardPadding + 12 + 6 + bodyHeight + cardPadding;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, startY, contentWidth, cardHeight, 12, 12, "FD");

  let y = startY + cardPadding;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(title, margin + cardPadding, y);
  y += 18;

  const tableX = margin + cardPadding;
  measurements.forEach((row, index) => {
    const rowTop = y;
    const rowHeight = row.height;

    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.6);
    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    doc.roundedRect(tableX, rowTop, tableWidth, rowHeight, 6, 6, "FD");

    const labelX = tableX + 14;
    const valueX = tableX + labelColumnWidth + columnGap;
    const textY = rowTop + rowPadding + 12;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    row.labelLines.forEach((line, lineIndex) => {
      doc.text(line, labelX, textY + lineIndex * lineHeight);
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    row.valueLines.forEach((line, lineIndex) => {
      doc.text(line, valueX, textY + lineIndex * lineHeight);
    });

    y += rowHeight + rowSpacing;
  });

  return startY + cardHeight + SECTION_GAP;
};

const drawSelectedOptionsCard = (doc, { options, startY, margin, pageWidth }) => {
  if (!options.length) {
    return startY;
  }

  const cardPadding = 24;
  const contentWidth = pageWidth - margin * 2;
  const bodyWidth = contentWidth - cardPadding * 2;
  const nameLineHeight = 16;
  const detailLineHeight = 14;

  const items = options.map((option) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const nameLines = doc.splitTextToSize(ensureValue(option.name), bodyWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const detailLine = `${ensureValue(option.capacity)} · max height ${ensureValue(option.maxHeight)}`;
    const detailLines = doc.splitTextToSize(detailLine, bodyWidth);
    const height =
      nameLines.length * nameLineHeight +
      (detailLines.length ? detailLines.length * detailLineHeight + 6 : 0) +
      10;
    return { nameLines, detailLines, height };
  });

  const bodyHeight = items.reduce((total, item) => total + item.height, 0);
  const dividersHeight = (items.length - 1) * 12;
  const cardHeight = cardPadding + 12 + 8 + bodyHeight + dividersHeight + cardPadding;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, startY, contentWidth, cardHeight, 12, 12, "FD");

  let y = startY + cardPadding;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text("Selected fence options", margin + cardPadding, y);
  y += 20;

  items.forEach((item, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(item.nameLines, margin + cardPadding, y);
    y += item.nameLines.length * nameLineHeight;

    if (item.detailLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(item.detailLines, margin + cardPadding, y);
      y += item.detailLines.length * detailLineHeight;
    }

    y += 10;
    if (index < items.length - 1) {
      doc.setDrawColor(229, 231, 235);
      doc.line(margin + cardPadding, y, margin + contentWidth - cardPadding, y);
      y += 12;
    }
  });

  return startY + cardHeight + SECTION_GAP;
};

const drawInfoCard = (doc, { items, startY, margin, pageWidth }) => {
  if (!items.length) {
    return startY;
  }

  const cardPadding = 24;
  const contentWidth = pageWidth - margin * 2;
  const textWidth = contentWidth - cardPadding * 2;
  const headingLineHeight = 13;
  const bodyLineHeight = 12;

  const measured = items.map((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const headingLines = doc.splitTextToSize(ensureValue(item.heading), textWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const bodyLines = doc.splitTextToSize(ensureValue(item.text), textWidth);
    const height =
      headingLines.length * headingLineHeight +
      (bodyLines.length ? bodyLines.length * bodyLineHeight + 10 : 0);
    return { headingLines, bodyLines, height };
  });

  const bodyHeight = measured.reduce(
    (total, item, index) => total + item.height + (index < measured.length - 1 ? 14 : 0),
    0
  );
  const cardHeight = cardPadding + bodyHeight + cardPadding;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, startY, contentWidth, cardHeight, 12, 12, "FD");

  let y = startY + cardPadding;
  measured.forEach((item, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(55, 65, 81);
    doc.text(item.headingLines, margin + cardPadding, y);
    y += item.headingLines.length * headingLineHeight;

    if (item.bodyLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(item.bodyLines, margin + cardPadding, y);
      y += item.bodyLines.length * bodyLineHeight;
    }

    if (index < measured.length - 1) {
      y += 14;
    }
  });

  return startY + cardHeight + SECTION_GAP;
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
  const contentWidth = pageWidth - margin * 2;

  const { meta } = payload;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, margin, contentWidth, 118, 16, 16, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(meta.projectName || "Design brief", margin + 28, margin + 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(75, 85, 99);
  doc.text(`Postcode: ${meta.postcode || "–"}`, margin + 28, margin + 66);
  if (meta.generatedLabel) {
    doc.text(`Generated: ${meta.generatedLabel}`, margin + 28, margin + 82);
  }

  const logoDataUrl = await getDataUrlForImage(BROWNE_LOGO_URL, createBrowneLogoFallback);
  if (logoDataUrl) {
    const logoWidth = 132;
    const logoHeight = 48;
    doc.addImage(
      logoDataUrl,
      inferImageFormat(logoDataUrl),
      pageWidth - margin - 28 - logoWidth,
      margin + 24,
      logoWidth,
      logoHeight
    );
  }

  let y = margin + 118 + SECTION_GAP;

  y = drawSelectedOptionsCard(doc, {
    options: payload.selectedOptions,
    startY: y,
    margin,
    pageWidth,
  });

  if (mapImage) {
    const cardPadding = 24;
    const mapWidth = contentWidth - cardPadding * 2;
    const mapSize = Math.min(mapWidth, 360);
    const cardHeight = cardPadding + 12 + 12 + mapSize + 28 + cardPadding;

    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, y, contentWidth, cardHeight, 12, 12, "FD");

    const headingY = y + cardPadding + 12;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text("Site location map", margin + cardPadding, headingY);

    const mapY = headingY + 12;
    doc.addImage(
      mapImage,
      "PNG",
      margin + cardPadding,
      mapY,
      mapSize,
      mapSize
    );
    doc.setDrawColor(209, 213, 219);
    doc.roundedRect(margin + cardPadding, mapY, mapSize, mapSize, 10, 10, "S");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(
      meta.postcode ? `Centered on ${meta.postcode}` : "Map capture",
      margin + cardPadding,
      mapY + mapSize + 18
    );

    y += cardHeight + SECTION_GAP;
  }

  y = drawTableCard(doc, {
    title: "Inputs",
    rows: payload.inputs,
    startY: y,
    margin,
    pageWidth,
  });

  y = drawTableCard(doc, {
    title: "Wind outputs",
    rows: payload.outputs,
    startY: y,
    margin,
    pageWidth,
  });

  const infoItems = [];
  if (payload.windSource) {
    infoItems.push({ heading: "Wind data source", text: payload.windSource });
  }
  if (payload.terrain.description) {
    infoItems.push({ heading: payload.terrain.label || "Terrain notes", text: payload.terrain.description });
  }

  y = drawInfoCard(doc, {
    items: infoItems,
    startY: y,
    margin,
    pageWidth,
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const footerLines = doc.splitTextToSize(payload.notes, contentWidth);
  const footerY = pageHeight - margin / 2;
  doc.text(footerLines, margin, footerY);

  const fileName = getDesignBriefFileName(meta.projectName, meta.generatedAt);
  doc.save(fileName);

  return fileName;
};
