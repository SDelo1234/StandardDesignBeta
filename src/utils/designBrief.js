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

const SECTION_GAP = 24;
const CARD_GAP = 18;
const COLUMN_GAP = 24;

const drawTableCard = (doc, { title, rows, startX, startY, width }) => {
  if (!rows.length) {
    return startY;
  }

  const cardPadding = 18;
  const tableWidth = width - cardPadding * 2;
  const labelColumnWidth = Math.min(170, tableWidth * 0.44);
  const columnGap = 14;
  const valueColumnWidth = tableWidth - labelColumnWidth - columnGap;
  const rowPadding = 6;
  const valueLineHeight = 13;
  const labelLineHeight = 11;
  const rowSpacing = 4;

  const measurements = rows.map((row) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const labelLines = doc.splitTextToSize(ensureValue(row.label), labelColumnWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const valueLines = doc.splitTextToSize(ensureValue(row.value), valueColumnWidth);
    const contentHeight = Math.max(
      labelLines.length * labelLineHeight,
      valueLines.length * valueLineHeight
    );
    const height = contentHeight + rowPadding * 2;
    return { labelLines, valueLines, height };
  });

  const bodyHeight = measurements.reduce(
    (total, row, index) => total + row.height + (index < measurements.length - 1 ? rowSpacing : 0),
    0
  );
  const cardHeight = cardPadding + 18 + bodyHeight + cardPadding;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(startX, startY, width, cardHeight, 12, 12, "FD");

  let y = startY + cardPadding + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(title, startX + cardPadding, y);
  y += 14;

  const tableX = startX + cardPadding;
  measurements.forEach((row, index) => {
    const rowTop = y;
    const rowHeight = row.height;

    doc.setDrawColor(234, 236, 240);
    doc.setLineWidth(0.4);
    doc.setFillColor(index % 2 === 0 ? 248 : 255, 250, 252);
    doc.roundedRect(tableX, rowTop, tableWidth, rowHeight, 6, 6, "FD");

    const labelX = tableX + 10;
    const valueX = tableX + labelColumnWidth + columnGap;
    const textY = rowTop + rowPadding + labelLineHeight;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    row.labelLines.forEach((line, lineIndex) => {
      doc.text(line, labelX, textY + lineIndex * labelLineHeight);
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    row.valueLines.forEach((line, lineIndex) => {
      doc.text(line, valueX, textY + lineIndex * valueLineHeight);
    });

    y += rowHeight + rowSpacing;
  });

  return startY + cardHeight;
};

const drawSelectedOptionsCard = (doc, { options, startX, startY, width }) => {
  if (!options.length) {
    return startY;
  }

  const cardPadding = 18;
  const bodyWidth = width - cardPadding * 2;
  const nameLineHeight = 14;
  const detailLineHeight = 12;

  const items = options.map((option) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const nameLines = doc.splitTextToSize(ensureValue(option.name), bodyWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const detailLine = `${ensureValue(option.capacity)} · max height ${ensureValue(option.maxHeight)}`;
    const detailLines = doc.splitTextToSize(detailLine, bodyWidth);
    const height =
      nameLines.length * nameLineHeight +
      (detailLines.length ? detailLines.length * detailLineHeight + 4 : 0) +
      8;
    return { nameLines, detailLines, height };
  });

  const bodyHeight = items.reduce((total, item) => total + item.height, 0);
  const dividersHeight = (items.length - 1) * 10;
  const cardHeight = cardPadding + 18 + bodyHeight + dividersHeight + cardPadding;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(startX, startY, width, cardHeight, 12, 12, "FD");

  let y = startY + cardPadding + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Selected fence options", startX + cardPadding, y);
  y += 16;

  items.forEach((item, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(item.nameLines, startX + cardPadding, y);
    y += item.nameLines.length * nameLineHeight;

    if (item.detailLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      doc.text(item.detailLines, startX + cardPadding, y);
      y += item.detailLines.length * detailLineHeight;
    }

    y += 8;
    if (index < items.length - 1) {
      doc.setDrawColor(229, 231, 235);
      doc.line(startX + cardPadding, y, startX + width - cardPadding, y);
      y += 10;
    }
  });

  return startY + cardHeight;
};

const drawMapCard = (doc, { mapImage, caption, startX, startY, width }) => {
  if (!mapImage) {
    return startY;
  }

  const cardPadding = 18;
  const mapWidth = width - cardPadding * 2;
  const mapSize = Math.min(mapWidth, 180);
  const cardHeight = cardPadding + 18 + mapSize + 26 + cardPadding;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(startX, startY, width, cardHeight, 12, 12, "FD");

  const headingY = startY + cardPadding + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Site location map", startX + cardPadding, headingY);

  const mapY = headingY + 10;
  const mapX = startX + cardPadding;
  doc.addImage(mapImage, inferImageFormat(mapImage), mapX, mapY, mapSize, mapSize);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(mapX, mapY, mapSize, mapSize, 10, 10, "S");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(caption, mapX, mapY + mapSize + 14);

  return startY + cardHeight;
};

const drawInfoCard = (doc, { items, startX, startY, width }) => {
  if (!items.length) {
    return startY;
  }

  const cardPadding = 18;
  const textWidth = width - cardPadding * 2;
  const headingLineHeight = 12;
  const bodyLineHeight = 11;

  const measured = items.map((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const headingLines = doc.splitTextToSize(ensureValue(item.heading), textWidth);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const bodyLines = doc.splitTextToSize(ensureValue(item.text), textWidth);
    const height =
      headingLines.length * headingLineHeight +
      (bodyLines.length ? bodyLines.length * bodyLineHeight + 6 : 0);
    return { headingLines, bodyLines, height };
  });

  const bodyHeight = measured.reduce(
    (total, item, index) => total + item.height + (index < measured.length - 1 ? 10 : 0),
    0
  );
  const cardHeight = cardPadding + bodyHeight + cardPadding;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(startX, startY, width, cardHeight, 12, 12, "FD");

  let y = startY + cardPadding;
  measured.forEach((item, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text(item.headingLines, startX + cardPadding, y);
    y += item.headingLines.length * headingLineHeight;

    if (item.bodyLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(item.bodyLines, startX + cardPadding, y);
      y += item.bodyLines.length * bodyLineHeight;
    }

    if (index < measured.length - 1) {
      y += 10;
    }
  });

  return startY + cardHeight;
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

  const headerHeight = 104;
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, margin, contentWidth, headerHeight, 16, 16, "FD");

  const headerTextX = margin + 28;
  let headerY = margin + 40;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(17, 24, 39);
  doc.text(meta.projectName || "Design brief", headerTextX, headerY);

  headerY += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Postcode: ${meta.postcode || "–"}`, headerTextX, headerY);

  if (meta.generatedLabel) {
    headerY += 16;
    doc.text(`Generated: ${meta.generatedLabel}`, headerTextX, headerY);
  }

  const logoDataUrl = await getDataUrlForImage(BROWNE_LOGO_URL, createBrowneLogoFallback);
  if (logoDataUrl) {
    const logoWidth = 110;
    const logoHeight = 40;
    doc.addImage(
      logoDataUrl,
      inferImageFormat(logoDataUrl),
      pageWidth - margin - 28 - logoWidth,
      margin + 26,
      logoWidth,
      logoHeight
    );
  }

  const columnWidth = (contentWidth - COLUMN_GAP) / 2;
  const columnX = [margin, margin + columnWidth + COLUMN_GAP];
  const initialY = margin + headerHeight + SECTION_GAP;
  const columnHeights = [initialY, initialY];
  const columnHasContent = [false, false];

  const addCardToColumn = (index, drawCard) => {
    if (columnHasContent[index]) {
      columnHeights[index] += CARD_GAP;
    }
    columnHeights[index] = drawCard(columnHeights[index]);
    columnHasContent[index] = true;
  };

  if (payload.selectedOptions.length) {
    addCardToColumn(0, (startY) =>
      drawSelectedOptionsCard(doc, {
        options: payload.selectedOptions,
        startX: columnX[0],
        startY,
        width: columnWidth,
      })
    );
  }

  if (mapImage) {
    addCardToColumn(0, (startY) =>
      drawMapCard(doc, {
        mapImage,
        caption: meta.postcode ? `Centered on ${meta.postcode}` : "Map capture",
        startX: columnX[0],
        startY,
        width: columnWidth,
      })
    );
  }

  addCardToColumn(1, (startY) =>
    drawTableCard(doc, {
      title: "Inputs",
      rows: payload.inputs,
      startX: columnX[1],
      startY,
      width: columnWidth,
    })
  );

  addCardToColumn(1, (startY) =>
    drawTableCard(doc, {
      title: "Wind outputs",
      rows: payload.outputs,
      startX: columnX[1],
      startY,
      width: columnWidth,
    })
  );

  const infoItems = [];
  if (payload.windSource) {
    infoItems.push({ heading: "Wind data source", text: payload.windSource });
  }
  if (payload.terrain.description) {
    infoItems.push({ heading: payload.terrain.label || "Terrain notes", text: payload.terrain.description });
  }

  if (infoItems.length) {
    const targetColumn = columnHeights[0] <= columnHeights[1] ? 0 : 1;
    addCardToColumn(targetColumn, (startY) =>
      drawInfoCard(doc, {
        items: infoItems,
        startX: columnX[targetColumn],
        startY,
        width: columnWidth,
      })
    );
  }

  const contentBottom = Math.max(columnHeights[0], columnHeights[1]);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const footerLines = doc.splitTextToSize(payload.notes, contentWidth);
  const footerY = Math.min(pageHeight - margin / 2, contentBottom + SECTION_GAP);
  doc.text(footerLines, margin, footerY);

  const fileName = getDesignBriefFileName(meta.projectName, meta.generatedAt);
  doc.save(fileName);

  return fileName;
};
