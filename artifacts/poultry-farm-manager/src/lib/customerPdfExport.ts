import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type CustomerInvoiceFilter = "all" | "paid" | "unpaid" | "partial";

export interface CustomerPdfTotals {
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number;
}

export interface CustomerPdfDateRange {
  start: string;
  end: string;
}

export interface CustomerPaymentRow {
  paymentDate?: string | null;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  amount?: number | null;
  notes?: string | null;
}

export interface CustomerSaleRow {
  id: number;
  invoiceNumber?: string | null;
  saleDate?: string | null;
  totalAmount?: number | null;
  paidAmount?: number | null;
  paymentStatus?: string | null;
}

export interface CustomerPdfExportData {
  customerName: string;
  customerId: number;
  sales: CustomerSaleRow[];
  payments: CustomerPaymentRow[];
  totals: CustomerPdfTotals;
  filter: CustomerInvoiceFilter;
  dateRange: CustomerPdfDateRange;
  includePayments: boolean;
  includeSummary: boolean;
}

function fmtPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `PKR ${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\-. ]/g, "").replace(/\s+/g, "_");
}

function fmtDate(date: string | null | undefined): string {
  if (!date) return "-";
  // Data is typically already YYYY-MM-DD; keep it stable in exports
  return String(date).slice(0, 10);
}

export async function generateCustomerPDF(data: CustomerPdfExportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Customer Statement", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${data.customerName}`, 14, y);
  y += 5;
  doc.text(`Customer ID: #${data.customerId}`, 14, y);
  y += 5;
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y);
  y += 6;

  // Filter info
  const hasFilters =
    data.filter !== "all" || Boolean(data.dateRange.start) || Boolean(data.dateRange.end);
  if (hasFilters) {
    doc.setFontSize(9);
    doc.setTextColor(110);
    const filterText = [
      `Filter: ${data.filter.toUpperCase()}`,
      (data.dateRange.start || data.dateRange.end)
        ? `Date: ${data.dateRange.start || "Start"} to ${data.dateRange.end || "End"}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ");
    doc.text(filterText, 14, y);
    doc.setTextColor(0);
    y += 7;
  }

  // Summary box
  if (data.includeSummary) {
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Total Purchases", 20, y + 7);
    doc.text("Total Paid", pageWidth / 2 - 16, y + 7);
    doc.text("Balance Due", pageWidth - 55, y + 7);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(fmtPKR(data.totals.totalPurchases), 20, y + 17);

    doc.setTextColor(34, 197, 94);
    doc.text(fmtPKR(data.totals.totalPaid), pageWidth / 2 - 16, y + 17);

    doc.setTextColor(239, 68, 68);
    doc.text(fmtPKR(data.totals.balanceDue), pageWidth - 55, y + 17);

    doc.setTextColor(0);
    y += 32;
  }

  // Sales table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Sales History", 14, y);
  y += 6;

  const salesTableData = data.sales.map((sale) => {
    const total = Number(sale.totalAmount ?? 0);
    const paid = Number(sale.paidAmount ?? 0);
    const balance = Math.max(0, total - paid);
    return [
      sale.invoiceNumber || "-",
      fmtDate(sale.saleDate),
      fmtPKR(total),
      fmtPKR(paid),
      fmtPKR(balance),
      String(sale.paymentStatus || "unpaid").toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Invoice", "Date", "Amount", "Paid", "Balance", "Status"]],
    body: salesTableData,
    theme: "striped",
    headStyles: { fillColor: [34, 197, 94] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 24 },
      5: { cellWidth: 22 },
    },
  });

  const lastY = (doc as any).lastAutoTable?.finalY as number | undefined;
  y = (lastY ?? y) + 10;

  // Payments table
  if (data.includePayments && data.payments.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 18;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Payment History", 14, y);
    y += 6;

    const paymentsTableData = data.payments.map((p) => [
      fmtDate(p.paymentDate ?? null),
      p.invoiceNumber || "-",
      p.paymentMethod || "-",
      fmtPKR(Number(p.amount ?? 0)),
      p.notes || "-",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Date", "Invoice", "Method", "Amount", "Notes"]],
      body: paymentsTableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 28 },
        2: { cellWidth: 22 },
        3: { cellWidth: 26 },
      },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by Poultry Farm Manager`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  const fileName = sanitizeFilename(
    `${data.customerName}_Statement_${new Date().toISOString().split("T")[0]}.pdf`
  );
  doc.save(fileName);
}

