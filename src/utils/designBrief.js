import { formatPostcode } from "./postcode.js";
import { getTerrainOption } from "./terrain.js";
import {
  formatAltitudeValue,
  formatFactor,
  formatPressure,
  formatWindSpeed,
} from "./formatters.js";
import { MONTH_LABELS, getDurationLabel } from "./formOptions.js";

const BROWNE_LOGO_URL = "https://browne.co.uk/wp-content/themes/browne/images/logo.jpg";

const LIMITATIONS = [
  "Fence capacities are peak velocity pressures qp; the net pressure coefficient cp,net is included in the fence system design.",
  "The exposure factor is an approximation to UK NA Figures NA.7/NA.8 unless a manual value is shown. Displacement height is taken as zero.",
  "Distance to sea is approximate (±5 km) unless entered manually.",
  "Orography is only included where it has been marked significant and c_o entered.",
  "This brief is to be checked and signed by a competent temporary works designer before use.",
];

const ensureValue = (value) => (value === null || value === undefined || value === "" ? "–" : value);

const logoDataUrlCache = {};

const getDataUrlForImage = async (url) => {
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

export const formatTraceValue = (row) => {
  const digits = row.unit === "kPa" ? 3 : row.unit === "m/s" ? 2 : row.unit === "years" ? 0 : 3;
  return `${row.value.toFixed(digits)}${row.unit ? ` ${row.unit}` : ""}`;
};

const sourceLabel = (manual, match) => {
  if (manual) return "manual";
  if (!match) return "–";
  return `dataset, ${match.match}`;
};

export const createDesignBriefPayload = ({
  form,
  result,
  selectedIds,
  site = {},
  currentDate = new Date(),
}) => {
  if (!result || !result.ok) {
    throw new Error("A completed wind calculation is required to create the design brief payload.");
  }

  const selectedOptions = result.options
    .filter((option) => selectedIds.includes(option.id))
    .map((option) => ({
      id: option.id,
      name: option.name,
      capacity: formatPressure(option.capacity_kpa),
      maxHeight: Number.isFinite(option.maxHeight_m) ? `${option.maxHeight_m.toFixed(1)} m` : "–",
      utilisation: Number.isFinite(option.utilisation) ? `${Math.round(option.utilisation * 100)}%` : "–",
    }));

  const terrainOption = getTerrainOption(form.terrain);
  const monthLabel =
    typeof form.installationMonth === "number"
      ? MONTH_LABELS[form.installationMonth - 1] || "–"
      : "–";
  const durationLabel = getDurationLabel(form.durationCategory) || "–";
  const vbMapRow = result.trace.find((row) => row.symbol === "vb,map");
  const altitudeValue = site.altitudeManual ? Number(form.altitudeOverride) : site.altitudeMatch?.altitude;

  const inputs = [
    { label: "Project name", value: ensureValue((form.projectName || "").trim()) },
    { label: "Project postcode", value: formatPostcode((form.postcode || "").trim()) || "–" },
    {
      label: "Site location",
      value: site.location
        ? `${site.location.lat.toFixed(5)}, ${site.location.lon.toFixed(5)} (${
            site.location.source === "pin" ? "map pin" : "postcode"
          })`
        : "–",
    },
    { label: "Month installed", value: monthLabel },
    { label: "Expected duration", value: durationLabel },
    { label: "Fence height", value: Number.isFinite(form.height) ? `${form.height.toFixed(1)} m` : "–" },
    { label: "Fence length", value: site.fenceLengthM > 0 ? `${Math.round(site.fenceLengthM)} m (from map)` : "–" },
    { label: "Ground conditions", value: ensureValue(form.ground) },
    {
      label: "Terrain",
      value:
        form.terrain === "town" && form.distanceIntoTown
          ? `${terrainOption?.title ?? "Town"}, ${form.distanceIntoTown} km inside town`
          : terrainOption?.title ?? "–",
    },
    {
      label: "vb,map",
      value: vbMapRow ? `${formatWindSpeed(vbMapRow.value)} (${sourceLabel(site.vbManual, site.windMatch)})` : "–",
    },
    {
      label: "Altitude",
      value: Number.isFinite(altitudeValue)
        ? `${formatAltitudeValue(altitudeValue)} (${sourceLabel(site.altitudeManual, site.altitudeMatch)})`
        : "–",
    },
    {
      label: "Distance to sea",
      value: Number.isFinite(site.distanceToSea_km)
        ? `${site.distanceToSea_km.toFixed(1)} km (${site.distanceManual ? "manual" : "auto, ±5 km"})`
        : "–",
    },
    {
      label: "Orography",
      value: form.orographySignificant ? `Significant, c_o = ${ensureValue(form.co)}` : "Not significant",
    },
  ];

  const outputs = [
    { label: "Basic wind speed vb", value: formatWindSpeed(result.vb) },
    { label: "Basic pressure qb", value: formatPressure(result.qb) },
    { label: "Exposure factor", value: formatFactor(result.ce * result.ceT * result.cOrog) },
    { label: "Design pressure qp", value: formatPressure(result.qp) },
    { label: "Return period", value: `${result.factors.returnPeriod} years` },
    { label: "Calc engine", value: `v${result.engineVersion}` },
  ];

  const meta = {
    projectName: (form.projectName || "").trim(),
    postcode: formatPostcode((form.postcode || "").trim()),
    generatedAt: currentDate,
    generatedLabel: formatDateLabel(currentDate),
    requestedBy: (form.requestEmail || "").trim(),
    engineVersion: result.engineVersion,
  };

  return {
    meta,
    selectedOptions,
    customDesignRequired: result.options.every((option) => !option.passes),
    inputs,
    outputs,
    trace: result.trace.map((row) => ({
      symbol: row.symbol,
      // Standard PDF fonts have no Greek glyphs
      label: row.label.replace(/ρ/g, "rho "),
      value: formatTraceValue(row),
      ref: row.ref,
    })),
    warnings: result.warnings,
    limitations: LIMITATIONS,
  };
};

const SECTION_GAP = 24;
const CARD_GAP = 18;
const COLUMN_GAP = 24;

const measureTableCardHeight = (doc, { rows, width }) => {
  if (!rows.length) {
    return { cardHeight: 0, measurements: [] };
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

  return {
    cardHeight,
    measurements,
    tableWidth,
    labelColumnWidth,
    columnGap,
    valueColumnWidth,
    rowPadding,
  };
};

const drawTableCard = (doc, { title, rows, startX, startY, width, minHeight = 0 }) => {
  if (!rows.length) {
    return startY;
  }

  const {
    cardHeight: measuredHeight,
    measurements,
    tableWidth,
    labelColumnWidth,
    columnGap,
    valueColumnWidth,
    rowPadding,
  } = measureTableCardHeight(doc, { rows, width });
  const cardHeight = Math.max(measuredHeight, minHeight);
  const cardPadding = 18;
  const valueLineHeight = 13;
  const labelLineHeight = 11;
  const rowSpacing = 4;

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

    y += rowHeight;
    if (index < measurements.length - 1) {
      y += rowSpacing;
    }
  });

  return startY + cardHeight;
};

const measureWindOutputs = (doc, { rows, width }) => {
  if (!rows.length) {
    return {
      cardHeight: 0,
      columnMeasurements: [[], []],
      cardPadding: 18,
      columnWidth: 0,
      columnGap: 14,
    };
  }

  const cardPadding = 18;
  const contentWidth = width - cardPadding * 2;
  const columnGap = 16;
  const columnWidth = (contentWidth - columnGap) / 2;
  const rowPadding = 6;
  const labelLineHeight = 11;
  const valueLineHeight = 13;
  const rowSpacing = 4;

  const splitIndex = Math.ceil(rows.length / 2);
  const columns = [rows.slice(0, splitIndex), rows.slice(splitIndex)];

  const columnMeasurements = columns.map((columnRows) => {
    const measurements = columnRows.map((row) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const labelLines = doc.splitTextToSize(ensureValue(row.label), columnWidth - 20);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const valueLines = doc.splitTextToSize(ensureValue(row.value), columnWidth - 20);
      const labelHeight = labelLines.length * labelLineHeight;
      const valueHeight = valueLines.length * valueLineHeight;
      const contentHeight = labelHeight + valueHeight + 2;
      const height = contentHeight + rowPadding * 2;
      return { labelLines, valueLines, height, labelHeight, valueHeight };
    });

    const bodyHeight = measurements.reduce(
      (total, row, index) => total + row.height + (index < measurements.length - 1 ? rowSpacing : 0),
      0
    );
    return { measurements, bodyHeight };
  });

  const tallestColumnHeight = Math.max(columnMeasurements[0].bodyHeight, columnMeasurements[1].bodyHeight);
  const cardHeight = cardPadding + 18 + tallestColumnHeight + cardPadding;

  return { cardHeight, columnMeasurements, cardPadding, columnWidth, columnGap, rowPadding };
};

const drawWindOutputsCard = (doc, { rows, startX, startY, width, minHeight = 0 }) => {
  if (!rows.length) {
    return startY;
  }

  const {
    cardHeight: measuredHeight,
    columnMeasurements,
    cardPadding,
    columnWidth,
    columnGap,
    rowPadding,
  } = measureWindOutputs(doc, { rows, width });
  const cardHeight = Math.max(measuredHeight, minHeight);
  const labelLineHeight = 11;
  const valueLineHeight = 13;
  const rowSpacing = 4;

  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(startX, startY, width, cardHeight, 12, 12, "FD");

  let y = startY + cardPadding + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("Wind outputs", startX + cardPadding, y);
  y += 10;

  const columnXs = [startX + cardPadding, startX + cardPadding + columnWidth + columnGap];

  columnMeasurements.forEach((column, columnIndex) => {
    let rowY = y + 6;
    column.measurements.forEach((row, rowIndex) => {
      const rowTop = rowY;
      const rowHeight = row.height;

      doc.setDrawColor(234, 236, 240);
      doc.setLineWidth(0.4);
      doc.setFillColor(rowIndex % 2 === 0 ? 248 : 255, 250, 252);
      doc.roundedRect(columnXs[columnIndex], rowTop, columnWidth, rowHeight, 6, 6, "FD");

      const labelX = columnXs[columnIndex] + 10;
      const valueX = columnXs[columnIndex] + 10;
      const labelY = rowTop + rowPadding + labelLineHeight;
      const valueStartY = labelY + row.labelHeight + 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      row.labelLines.forEach((line, lineIndex) => {
        doc.text(line, labelX, labelY + lineIndex * labelLineHeight);
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(17, 24, 39);
      row.valueLines.forEach((line, lineIndex) => {
        doc.text(line, valueX, valueStartY + lineIndex * valueLineHeight);
      });

      rowY += rowHeight;
      if (rowIndex < column.measurements.length - 1) {
        rowY += rowSpacing;
      }
    });
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
    const detailLine = `Capacity qp ${ensureValue(option.capacity)} · max height ${ensureValue(option.maxHeight)} · utilisation ${ensureValue(option.utilisation)}`;
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

const getMapCardHeight = (width) => {
  const cardPadding = 18;
  const mapWidth = width - cardPadding * 2;
  const mapSize = Math.min(mapWidth, 180);
  return cardPadding + 18 + mapSize + 26 + cardPadding;
};

const drawMapCard = (doc, { mapImage, caption, startX, startY, width, minHeight = 0 }) => {
  if (!mapImage) {
    return startY;
  }

  const cardPadding = 18;
  const mapWidth = width - cardPadding * 2;
  const mapSize = Math.min(mapWidth, 180);
  const baseHeight = getMapCardHeight(width);
  const cardHeight = Math.max(baseHeight, minHeight);
  const extraSpace = cardHeight - baseHeight;

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
  doc.text(caption, mapX, mapY + mapSize + 14 + extraSpace);

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

const drawCalculationPage = (doc, { payload, margin, pageWidth, pageHeight, contentWidth }) => {
  doc.addPage();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text("Wind calculation", margin, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text("BS EN 1991-1-4 + UK NA, BS EN 1991-1-6", margin, y + 24);
  y += 40;

  const cols = [
    { key: "symbol", label: "Symbol", width: 62 },
    { key: "label", label: "Description", width: contentWidth - 62 - 80 - 120 },
    { key: "value", label: "Value", width: 80 },
    { key: "ref", label: "Reference", width: 120 },
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  let x = margin + 6;
  cols.forEach((col) => {
    doc.text(col.label, x, y + 12);
    x += col.width;
  });
  y += 18;

  payload.trace.forEach((row, index) => {
    doc.setFont("helvetica", row.symbol === "qp" ? "bold" : "normal");
    doc.setFontSize(8.5);
    const cells = cols.map((col) => doc.splitTextToSize(String(row[col.key] ?? "–"), col.width - 10));
    const height = Math.max(...cells.map((lines) => lines.length)) * 11 + 8;
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, contentWidth, height, "F");
    }
    doc.setTextColor(17, 24, 39);
    let cx = margin + 6;
    cells.forEach((lines, i) => {
      doc.text(lines, cx, y + 12);
      cx += cols[i].width;
    });
    y += height;
  });
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, margin + contentWidth, y);
  y += 20;

  const notes = [
    ...payload.warnings.map((text) => ({ heading: "Warning", text })),
    { heading: "Limitations", text: payload.limitations.map((line) => `• ${line}`).join("\n") },
  ];
  y = drawInfoCard(doc, { items: notes, startX: margin, startY: y, width: contentWidth }) + 20;

  // Sign-off block
  const boxHeight = 64;
  if (y + boxHeight > pageHeight - margin - 20) {
    doc.addPage();
    y = margin;
  }
  const boxWidth = contentWidth / 3;
  ["Prepared by", "Checked by", "Approved by"].forEach((title, i) => {
    const bx = margin + i * boxWidth;
    doc.setDrawColor(148, 163, 184);
    doc.rect(bx, y, boxWidth, boxHeight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(title, bx + 6, y + 12);
    doc.setFont("helvetica", "normal");
    doc.text("Name / signature / date", bx + 6, y + boxHeight - 8);
  });
  doc.setFontSize(8);
  doc.text("Revision: P01", pageWidth - margin, y + boxHeight + 14, { align: "right" });
};

const drawPageFooters = (doc, { meta, margin, pageWidth, pageHeight }) => {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      `${meta.projectName || "Design brief"} · calc engine v${meta.engineVersion} · ${meta.generatedLabel}`,
      margin,
      pageHeight - 24
    );
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 24, { align: "right" });
  }
};

export const generateDesignBriefPdf = async ({ payload, mapImage }) => {
  const { jsPDF: JsPDF } = await import("jspdf");
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

  headerY += 16;
  doc.text(`Design requested by: ${ensureValue(meta.requestedBy)}`, headerTextX, headerY);

  const logoWidth = 110;
  const logoHeight = 40;
  const logoX = pageWidth - margin - 28 - logoWidth;
  const logoY = margin + 26;
  const logoDataUrl = await getDataUrlForImage(BROWNE_LOGO_URL);
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, inferImageFormat(logoDataUrl), logoX, logoY, logoWidth, logoHeight);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(17, 24, 39);
    doc.text("BROWNE", logoX, logoY + logoHeight / 2 + 6);
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


  if (payload.customDesignRequired) {
    addCardToColumn(0, (startY) =>
      drawInfoCard(doc, {
        items: [
          {
            heading: "Custom design required",
            text: "No standard fence system is suitable for the design pressure at this site.",
          },
        ],
        startX: columnX[0],
        startY,
        width: columnWidth,
      })
    );
  }

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
        caption: meta.postcode ? `Site ${meta.postcode}` : "Map capture",
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

  addCardToColumn(0, (startY) =>
    drawWindOutputsCard(doc, {
      rows: payload.outputs,
      startX: columnX[0],
      startY,
      width: columnWidth,
    })
  );

  drawCalculationPage(doc, { payload, margin, pageWidth, pageHeight, contentWidth });
  drawPageFooters(doc, { meta, margin, pageWidth, pageHeight });

  const fileName = getDesignBriefFileName(meta.projectName, meta.generatedAt);
  doc.save(fileName);

  return fileName;
};
