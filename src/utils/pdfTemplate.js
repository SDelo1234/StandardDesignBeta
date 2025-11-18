import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const CM_TO_POINTS = 72 / 2.54;
const DEFAULT_FONT_SIZE = 12;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DEFAULT_TEMPLATE_PATH = path.resolve(
  __dirname,
  '../../public/data/Example PDF 1 - flattened-rs.pdf',
);

const cmToPoints = (centimetres) => centimetres * CM_TO_POINTS;

const drawFieldsOnPage = (page, fields, font) => {
  fields.forEach(({ text, xCm, yCm, fontSize = DEFAULT_FONT_SIZE }) => {
    const x = cmToPoints(xCm);
    const y = cmToPoints(yCm);

    page.drawText(text, { x, y, font, size: fontSize });
  });
};

export const renderTemplatePdf = async ({
  templatePath = DEFAULT_TEMPLATE_PATH,
  fields = [],
}) => {
  if (!Array.isArray(fields)) {
    throw new Error('Expected fields to be an array');
  }

  const templateBytes = await fs.readFile(templatePath);
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

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

export const createExampleHoardingPdf = async ({ postcode }) => {
  const fields = [];

  if (postcode) {
    fields.push({
      text: postcode,
      pageIndex: 0,
      xCm: 33.5,
      yCm: 3.2,
    });
  }

  return renderTemplatePdf({ fields });
};
