import { PDFDocument, StandardFonts } from "pdf-lib";

const CM_TO_POINTS = 72 / 2.54;
const DEFAULT_TEMPLATE_URL = encodeURI("/data/Example PDF 1 - flattened-rs.pdf");
const DEFAULT_FONT_SIZE = 12;

const cmToPoints = (centimetres) => centimetres * CM_TO_POINTS;

const loadTemplateBytes = async (templateUrl) => {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to load template PDF (status ${response.status})`);
  }
  return response.arrayBuffer();
};

const resolvePosition = (
  page,
  { x, y, xCm, yCm, fontSize = DEFAULT_FONT_SIZE, origin = "bottom-left" },
) => {
  if (typeof x === "number" && typeof y === "number") {
    return { x, y };
  }

  if (typeof xCm !== "number" || typeof yCm !== "number") {
    throw new Error("Field is missing coordinates (x/y or xCm/yCm)");
  }

  const xPoint = cmToPoints(xCm);

  if (origin === "top-left") {
    return {
      x: xPoint,
      y: page.getHeight() - cmToPoints(yCm) - fontSize,
    };
  }

  return { x: xPoint, y: cmToPoints(yCm) };
};

const drawFieldsOnPage = (page, fields, font) => {
  fields.forEach((field) => {
    const { text, fontSize = DEFAULT_FONT_SIZE } = field;
    const { x, y } = resolvePosition(page, field);

    page.drawText(text, { x, y, font, size: fontSize });
  });
};

export const renderTemplatePdfClient = async ({
  templateUrl = DEFAULT_TEMPLATE_URL,
  fields = [],
}) => {
  if (!Array.isArray(fields)) {
    throw new Error("Expected fields to be an array");
  }

  const templateBytes = await loadTemplateBytes(templateUrl);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  const fieldsByPage = fields.reduce((map, field) => {
    const { pageIndex } = field;

    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error(`Page index ${pageIndex} is out of range for template`);
    }

    if (!map[pageIndex]) {
      map[pageIndex] = [];
    }

    map[pageIndex].push(field);
    return map;
  }, {});

  Object.entries(fieldsByPage).forEach(([pageIndex, pageFields]) => {
    drawFieldsOnPage(pages[Number(pageIndex)], pageFields, font);
  });

  return pdfDoc.save();
};

export const createExampleHoardingPdfClient = async ({ postcode }) => {
  const fields = [];

  if (postcode) {
    fields.push({
      text: postcode,
      pageIndex: 0,
      x: 979,
      y: 77,
      fontSize: 14,
    });
  }

  return renderTemplatePdfClient({ fields });
};

export const downloadPdfBytes = (pdfBytes, filename = "Hoarding_Selected.pdf") => {
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
