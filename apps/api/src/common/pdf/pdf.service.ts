import { Injectable } from '@nestjs/common';
import {
  COLORS,
  drawFooter,
  drawHeader,
  drawInfoGrid,
  drawTable,
  drawTotals,
  renderToBuffer,
  sectionTitle,
} from './pdf.util';

const money = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (d: Date | string | null | undefined) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const now = () => new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

interface InvoiceData {
  invoiceRef: string;
  patientName: string;
  patientMrn: string;
  status: string;
  createdAt: Date | string;
  items: Array<{ description: string; quantity: number; unitPrice: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  notes: string | null;
}

interface LabReportData {
  orderRef: string;
  patientName: string;
  patientMrn: string;
  status: string;
  createdAt: Date | string;
  completedAt: Date | string | null;
  notes: string | null;
  items: Array<{ testName: string; resultValue: string | null; unit: string | null; referenceRange: string | null; flag: string | null }>;
}

interface StudyReportData {
  studyRef: string;
  patientName: string;
  patientMrn: string;
  examName: string;
  modality: string;
  bodyPart: string | null;
  status: string;
  createdAt: Date | string;
  findings: string | null;
  impression: string | null;
}

@Injectable()
export class PdfService {
  invoice(inv: InvoiceData): Promise<Buffer> {
    return renderToBuffer((doc) => {
      drawHeader(doc, 'INVOICE', inv.invoiceRef);
      drawInfoGrid(doc, [
        ['Patient', inv.patientName],
        ['MRN', inv.patientMrn],
        ['Status', inv.status],
        ['Date', day(inv.createdAt)],
      ]);

      sectionTitle(doc, 'Items');
      drawTable(
        doc,
        [
          { label: 'Description', width: 0.5 },
          { label: 'Qty', width: 0.14, align: 'right' },
          { label: 'Unit price', width: 0.18, align: 'right' },
          { label: 'Amount', width: 0.18, align: 'right' },
        ],
        inv.items.map((i) => [i.description, String(i.quantity), money(i.unitPrice), money(i.lineTotal)]),
      );

      drawTotals(doc, [
        ['Subtotal', money(inv.subtotal)],
        ...(inv.discount ? [['Discount', `- ${money(inv.discount)}`] as [string, string]] : []),
        ['Tax', money(inv.tax)],
        ['Amount paid', money(inv.amountPaid)],
        [inv.balance > 0 ? 'Balance due' : 'Total', money(inv.balance > 0 ? inv.balance : inv.total)],
      ]);

      if (inv.notes) {
        sectionTitle(doc, 'Notes');
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted).text(inv.notes);
      }
      drawFooter(doc, now());
    });
  }

  labReport(o: LabReportData): Promise<Buffer> {
    return renderToBuffer((doc) => {
      drawHeader(doc, 'LABORATORY REPORT', o.orderRef);
      drawInfoGrid(doc, [
        ['Patient', o.patientName],
        ['MRN', o.patientMrn],
        ['Status', o.status],
        ['Reported', day(o.completedAt ?? o.createdAt)],
      ]);

      sectionTitle(doc, 'Results');
      drawTable(
        doc,
        [
          { label: 'Test', width: 0.4 },
          { label: 'Result', width: 0.2, align: 'right' },
          { label: 'Unit', width: 0.14 },
          { label: 'Reference', width: 0.18 },
          { label: 'Flag', width: 0.08, align: 'center' },
        ],
        o.items.map((i) => [i.testName, i.resultValue ?? '—', i.unit ?? '', i.referenceRange ?? '', i.flag ?? '']),
      );

      if (o.notes) {
        sectionTitle(doc, 'Notes');
        doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted).text(o.notes);
      }
      drawFooter(doc, now());
    });
  }

  radiologyReport(s: StudyReportData): Promise<Buffer> {
    return renderToBuffer((doc) => {
      drawHeader(doc, 'RADIOLOGY REPORT', s.studyRef);
      drawInfoGrid(doc, [
        ['Patient', s.patientName],
        ['MRN', s.patientMrn],
        ['Exam', `${s.examName} (${s.modality})`],
        ['Body part', s.bodyPart ?? '—'],
        ['Status', s.status],
        ['Date', day(s.createdAt)],
      ]);

      sectionTitle(doc, 'Findings');
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.ink).text(s.findings ?? 'No findings recorded.', { align: 'left' });

      sectionTitle(doc, 'Impression');
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.ink).text(s.impression ?? '—', { align: 'left' });

      drawFooter(doc, now());
    });
  }
}
