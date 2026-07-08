import type { Response } from 'express';
import PDFDocument from 'pdfkit';

export type Doc = PDFKit.PDFDocument;

/** Sends a rendered PDF buffer inline with the given filename. */
export function sendPdf(res: Response, filename: string, buffer: Buffer) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
}

/** Brand colours reused across documents. */
export const COLORS = {
  brand: '#2563eb',
  ink: '#0f172a',
  muted: '#64748b',
  line: '#e2e8f0',
  zebra: '#f8fafc',
} as const;

/** Runs the builder against a fresh A4 document and resolves the rendered bytes. */
export function renderToBuffer(build: (doc: Doc) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      build(doc);
      doc.end();
    } catch (err) {
      reject(err as Error);
    }
  });
}

/** Standard document header: brand bar, hospital name, document title + reference. */
export function drawHeader(doc: Doc, title: string, reference: string) {
  const { left, right } = { left: doc.page.margins.left, right: doc.page.width - doc.page.margins.right };
  doc.rect(0, 0, doc.page.width, 8).fill(COLORS.brand);
  doc.fillColor(COLORS.brand).fontSize(20).font('Helvetica-Bold').text('HMS', left, 40);
  doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica').text('Hospital Management System', left, 64);

  doc.fillColor(COLORS.ink).fontSize(16).font('Helvetica-Bold').text(title, left, 40, { width: right - left, align: 'right' });
  doc.fillColor(COLORS.muted).fontSize(10).font('Helvetica').text(reference, { width: right - left, align: 'right' });

  doc.moveTo(left, 90).lineTo(right, 90).strokeColor(COLORS.line).lineWidth(1).stroke();
  doc.y = 105;
  doc.fillColor(COLORS.ink);
}

/** Two-column key/value block; returns the y below it. */
export function drawInfoGrid(doc: Doc, rows: Array<[string, string]>) {
  const left = doc.page.margins.left;
  const colWidth = (doc.page.width - left - doc.page.margins.right) / 2;
  const startY = doc.y;
  rows.forEach((row, i) => {
    const col = i % 2;
    const x = left + col * colWidth;
    const y = startY + Math.floor(i / 2) * 34;
    doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted).text(row[0].toUpperCase(), x, y);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.ink).text(row[1] || '—', x, y + 11, { width: colWidth - 12 });
  });
  doc.y = startY + Math.ceil(rows.length / 2) * 34 + 8;
  return doc.y;
}

export function sectionTitle(doc: Doc, text: string) {
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.brand).text(text, doc.page.margins.left, doc.y);
  doc.moveDown(0.3);
  doc.fillColor(COLORS.ink);
}

export interface Column {
  label: string;
  width: number; // fraction of the content width
  align?: 'left' | 'right' | 'center';
}

/** Renders a simple table with a header row and zebra striping. */
export function drawTable(doc: Doc, columns: Column[], rows: string[][]) {
  const left = doc.page.margins.left;
  const contentWidth = doc.page.width - left - doc.page.margins.right;
  const widths = columns.map((c) => c.width * contentWidth);
  const xs: number[] = [];
  let cursor = left;
  for (const w of widths) {
    xs.push(cursor);
    cursor += w;
  }

  const drawRow = (cells: string[], y: number, opts: { header?: boolean; zebra?: boolean }) => {
    if (opts.zebra) doc.rect(left, y - 3, contentWidth, 20).fill(COLORS.zebra);
    columns.forEach((c, i) => {
      doc
        .fontSize(9)
        .font(opts.header ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(opts.header ? COLORS.muted : COLORS.ink)
        .text(cells[i] ?? '', (xs[i] ?? left) + 2, y, { width: (widths[i] ?? 0) - 4, align: c.align ?? 'left' });
    });
  };

  let y = doc.y;
  drawRow(columns.map((c) => c.label), y, { header: true });
  y += 18;
  doc.moveTo(left, y - 2).lineTo(left + contentWidth, y - 2).strokeColor(COLORS.line).stroke();
  rows.forEach((r, i) => {
    if (y > doc.page.height - 90) { doc.addPage(); y = doc.page.margins.top; }
    drawRow(r, y, { zebra: i % 2 === 1 });
    y += 20;
  });
  doc.y = y + 4;
}

/** Right-aligned totals block (label/value pairs); the last row is emphasised. */
export function drawTotals(doc: Doc, rows: Array<[string, string]>) {
  const right = doc.page.width - doc.page.margins.right;
  const boxWidth = 240;
  const x = right - boxWidth;
  let y = doc.y + 4;
  rows.forEach((row, i) => {
    const emphasise = i === rows.length - 1;
    if (emphasise) doc.moveTo(x, y - 3).lineTo(right, y - 3).strokeColor(COLORS.line).stroke();
    doc.fontSize(emphasise ? 12 : 10).font(emphasise ? 'Helvetica-Bold' : 'Helvetica').fillColor(emphasise ? COLORS.ink : COLORS.muted);
    doc.text(row[0], x, y + (emphasise ? 3 : 0), { width: boxWidth / 2 });
    doc.text(row[1], x + boxWidth / 2, y + (emphasise ? 3 : 0), { width: boxWidth / 2, align: 'right' });
    y += emphasise ? 24 : 18;
  });
  doc.y = y;
}

/** Footer with generation timestamp, drawn in the bottom margin of the current page. */
export function drawFooter(doc: Doc, generatedAt: string) {
  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  // Writing inside the bottom margin would trigger pdfkit auto-pagination; disable it here.
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const y = doc.page.height - 42;
  doc.moveTo(left, y - 8).lineTo(right, y - 8).strokeColor(COLORS.line).lineWidth(1).stroke();
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted).text(`Generated ${generatedAt}`, left, y, { lineBreak: false });
  doc.text('This is a system-generated document.', left, y, { width: right - left, align: 'right', lineBreak: false });
  doc.page.margins.bottom = savedBottom;
}
