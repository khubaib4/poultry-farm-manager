import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SaleDetail, SalePayment } from "@/types/electron";

const COLORS = {
  primary: [26, 82, 118] as [number, number, number],
  text: [51, 51, 51] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  green: [39, 174, 96] as [number, number, number],
  red: [231, 76, 60] as [number, number, number],
  headerBg: [26, 82, 118] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  altRow: [245, 247, 250] as [number, number, number],
  lightBg: [248, 249, 250] as [number, number, number],
};

const UNIT_LABELS: Record<string, string> = { egg: "Eggs", tray: "Tray", peti: "Peti" };
const UNIT_MULTIPLIER: Record<string, number> = { egg: 1, tray: 30, peti: 360 };
const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque",
  mobile_payment: "Mobile Payment", online: "Online", other: "Other",
};

function fmt(amount: number): string {
  return `PKR ${amount.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PK", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export interface InvoiceFarmInfo {
  name: string;
  location: string | null;
  phone: string | null;
  email: string | null;
}

export function generateInvoicePDF(
  sale: SaleDetail,
  farm: InvoiceFarmInfo,
): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFontSize(20);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(farm.name, margin, y + 6);
  y += 10;

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  if (farm.location) { doc.text(farm.location, margin, y); y += 4; }
  if (farm.phone) { doc.text(`Phone: ${farm.phone}`, margin, y); y += 4; }
  if (farm.email) { doc.text(`Email: ${farm.email}`, margin, y); y += 4; }

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  doc.setFontSize(22);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", margin, y + 6);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "normal");
  const rightCol = pageWidth - margin;
  doc.text(`Invoice #: ${sale.invoiceNumber}`, rightCol, y - 2, { align: "right" });
  doc.text(`Date: ${fmtDate(sale.saleDate)}`, rightCol, y + 3, { align: "right" });
  if (sale.dueDate) {
    doc.text(`Due: ${fmtDate(sale.dueDate)}`, rightCol, y + 8, { align: "right" });
  }
  y += 16;

  doc.setFillColor(...COLORS.lightBg);
  doc.rect(margin, y, contentWidth, sale.customer.address ? 28 : 22, "F");

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO:", margin + 4, y + 5);

  doc.setFontSize(11);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "bold");
  doc.text(sale.customer.name, margin + 4, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let billY = y + 16;
  if (sale.customer.businessName) {
    doc.text(sale.customer.businessName, margin + 4, billY);
    billY += 4;
  }
  if (sale.customer.address) {
    doc.text(sale.customer.address, margin + 4, billY);
    billY += 4;
  }
  if (sale.customer.phone) {
    doc.text(`Phone: ${sale.customer.phone}`, margin + 4, billY);
    billY += 4;
  }

  y = Math.max(billY + 4, y + (sale.customer.address ? 32 : 26));

  const itemRows = sale.items.map(item => {
    const unitType = (item as any).unitType || (item.itemType === "tray" ? "tray" : "egg");
    const multiplier = UNIT_MULTIPLIER[unitType] ?? 1;
    const qty = Number(item.quantity ?? 0);
    const eggs = Number.isFinite(Number((item as any).totalEggs))
      ? Number((item as any).totalEggs)
      : Math.trunc(qty * multiplier);
    return [
      `${item.grade} - ${qty.toLocaleString()} ${UNIT_LABELS[unitType] || unitType} (${eggs.toLocaleString()} eggs)`,
      String(item.quantity ?? 0),
      fmt(item.unitPrice ?? 0),
      fmt(item.lineTotal ?? 0),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: itemRows,
    theme: "grid",
    headStyles: {
      fillColor: COLORS.headerBg,
      textColor: COLORS.headerText,
      fontStyle: "bold",
      fontSize: 9,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.text,
    },
    alternateRowStyles: {
      fillColor: COLORS.altRow,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 40;
  y += 6;

  const summaryX = pageWidth - margin - 80;
  const valueX = pageWidth - margin;

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.text);
  doc.setFont("helvetica", "normal");

  doc.text("Subtotal:", summaryX, y);
  doc.text(fmt(sale.subtotal ?? 0), valueX, y, { align: "right" });
  y += 5;

  if (sale.discountAmount && sale.discountAmount > 0) {
    const discLabel = sale.discountType === "percentage"
      ? `Discount (${sale.discountValue}%):`
      : "Discount:";
    doc.text(discLabel, summaryX, y);
    doc.setTextColor(...COLORS.green);
    doc.text(`-${fmt(sale.discountAmount)}`, valueX, y, { align: "right" });
    doc.setTextColor(...COLORS.text);
    y += 5;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(summaryX, y, valueX, y);
  y += 5;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", summaryX, y);
  doc.text(fmt(sale.totalAmount ?? 0), valueX, y, { align: "right" });
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.green);
  doc.text("Paid:", summaryX, y);
  doc.text(fmt(sale.paidAmount ?? 0), valueX, y, { align: "right" });
  y += 5;

  const balance = sale.balanceDue ?? 0;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  if (balance > 0) {
    doc.setTextColor(...COLORS.red);
  } else {
    doc.setTextColor(...COLORS.green);
  }
  doc.text("BALANCE DUE:", summaryX, y);
  doc.text(fmt(balance), valueX, y, { align: "right" });
  y += 10;

  if (sale.paymentStatus === "paid") {
    doc.setFontSize(36);
    doc.setTextColor(39, 174, 96);
    doc.setFont("helvetica", "bold");
    doc.text("PAID", pageWidth / 2, y - 30, { align: "center", angle: 0 });
    doc.setGState(new (doc as unknown as { GState: new (o: Record<string, number>) => unknown }).GState({ opacity: 0.15 }));
    doc.setFontSize(60);
    doc.text("PAID", pageWidth / 2, y - 25, { align: "center", angle: 25 });
    doc.setGState(new (doc as unknown as { GState: new (o: Record<string, number>) => unknown }).GState({ opacity: 1 }));
  }

  if (sale.payments.length > 0) {
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT HISTORY", margin, y);
    y += 4;

    const paymentRows = sale.payments.map((p: SalePayment) => [
      fmtDate(p.paymentDate),
      fmt(p.amount),
      METHOD_LABELS[p.paymentMethod || "other"] || p.paymentMethod || "—",
      p.notes || "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Date", "Amount", "Method", "Reference/Notes"]],
      body: paymentRows,
      theme: "grid",
      headStyles: {
        fillColor: [100, 100, 100],
        textColor: COLORS.headerText,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8, textColor: COLORS.text },
      alternateRowStyles: { fillColor: COLORS.altRow },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { halign: "right", cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: "auto" },
      },
      margin: { left: margin, right: margin },
    });

    y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;
    y += 8;
  }

  if (sale.notes) {
    doc.setTextColor(...COLORS.muted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(`Notes: ${sale.notes}`, margin, y);
    y += 8;
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Thank you for your business!", pageWidth / 2, y, { align: "center" });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Generated on ${new Date().toLocaleString()} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  return doc;
}

export function getInvoiceFilename(invoiceNumber: string, customerName: string): string {
  const sanitized = customerName.replace(/[^a-zA-Z0-9_ ]/g, "").replace(/\s+/g, "_");
  return `${invoiceNumber}_${sanitized}.pdf`;
}
