import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface SalesPdfTotals {
  totalSales: number;
  totalPaid: number;
  totalOutstanding: number;
  salesCount: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
}

export interface SalesPdfFilters {
  startDate: string;
  endDate: string;
  status: string;
  customerType: string;
  includeItems: boolean;
  includePayments: boolean;
  includeSummary: boolean;
  search: string;
}

export interface SalesPdfExportData {
  farmName: string;
  sales: any[];
  totals: SalesPdfTotals;
  filters: SalesPdfFilters;
}

function fmtPKR(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return `PKR ${safe.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(date: string | null | undefined): string {
  if (!date) return "-";
  return String(date).slice(0, 10);
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\-. ]/g, "").replace(/\s+/g, "_");
}

function customerLabel(sale: any): string {
  const existing = String(sale.customerName ?? "").trim();
  if (sale.customerId && existing) return existing;
  const walkIn = String(sale.walkInCustomerName ?? "").trim();
  if (walkIn) return `${walkIn} (Walk-in)`;
  return "Walk-in Customer";
}

export async function generateSalesListPDF(data: SalesPdfExportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(data.farmName, 14, y);
  doc.setFontSize(18);
  doc.text("Sales Report", pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110);
  const period =
    data.filters.startDate || data.filters.endDate
      ? `Period: ${data.filters.startDate || "Start"} to ${data.filters.endDate || "End"}`
      : "Period: All dates";
  doc.text(period, pageWidth / 2, y, { align: "center" });
  y += 5;

  const filterParts: string[] = [];
  if (data.filters.status && data.filters.status !== "all") filterParts.push(`Status: ${String(data.filters.status).toUpperCase()}`);
  if (data.filters.customerType && data.filters.customerType !== "all") filterParts.push(`Customers: ${String(data.filters.customerType)}`);
  if (String(data.filters.search || "").trim()) filterParts.push(`Search: "${String(data.filters.search).trim()}"`);
  if (filterParts.length > 0) {
    doc.text(filterParts.join(" | "), pageWidth / 2, y, { align: "center" });
    y += 5;
  }
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 10;

  // Summary box
  if (data.filters.includeSummary) {
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text("Total Sales", 20, y + 7);
    doc.text("Total Received", 65, y + 7);
    doc.text("Outstanding", 115, y + 7);
    doc.text("Sales Count", pageWidth - 45, y + 7);

    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(fmtPKR(data.totals.totalSales), 20, y + 16);
    doc.setTextColor(34, 197, 94);
    doc.text(fmtPKR(data.totals.totalPaid), 65, y + 16);
    doc.setTextColor(239, 68, 68);
    doc.text(fmtPKR(data.totals.totalOutstanding), 115, y + 16);
    doc.setTextColor(17, 24, 39);
    doc.text(String(data.totals.salesCount), pageWidth - 45, y + 16);

    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(
      `Paid: ${data.totals.paidCount} | Partial: ${data.totals.partialCount} | Unpaid: ${data.totals.unpaidCount}`,
      pageWidth - 45,
      y + 22,
      { align: "left" }
    );
    doc.setTextColor(0);
    y += 34;
  }

  // Sales table
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Sales Details", 14, y);
  y += 6;

  const rows = data.sales.map((sale) => {
    const total = Number(sale.totalAmount ?? 0);
    const paid = Number(sale.paidAmount ?? 0);
    const balance = Math.max(0, total - paid);
    return [
      sale.invoiceNumber || "-",
      fmtDate(sale.saleDate),
      customerLabel(sale),
      fmtPKR(total),
      fmtPKR(paid),
      fmtPKR(balance),
      String(sale.paymentStatus || "unpaid").toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Invoice", "Date", "Customer", "Total", "Paid", "Balance", "Status"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [34, 197, 94], fontSize: 8, fontStyle: "bold" },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 22 },
      2: { cellWidth: 44 },
      6: { cellWidth: 18 },
    },
    margin: { left: 14, right: 14 },
  });

  y = ((doc as any).lastAutoTable?.finalY ?? y) + 10;

  // Item details per invoice (optional)
  if (data.filters.includeItems) {
    const salesWithItems = data.sales.filter((s) => Array.isArray(s.items) && s.items.length > 0);
    if (salesWithItems.length > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 18;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Item Breakdown (per invoice)", 14, y);
      y += 6;

      for (const sale of salesWithItems) {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 18;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`${sale.invoiceNumber || "-"} — ${customerLabel(sale)}`, 14, y);
        y += 4;

        const itemRows = (sale.items || []).map((it: any) => {
          const qty = Number(it.quantity ?? 0);
          const unitPrice = Number(it.unitPrice ?? 0);
          const total = Number(it.lineTotal ?? qty * unitPrice);
          return [
            String(it.grade ?? it.category ?? "-"),
            String(it.unitType ?? it.itemType ?? "tray"),
            qty.toLocaleString(),
            fmtPKR(unitPrice),
            fmtPKR(total),
          ];
        });

        autoTable(doc, {
          startY: y,
          head: [["Category", "Unit", "Qty", "Unit Price", "Total"]],
          body: itemRows,
          theme: "grid",
          headStyles: { fillColor: [200, 200, 200], fontSize: 7, fontStyle: "bold" },
          styles: { fontSize: 7 },
          margin: { left: 18, right: 14 },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 16 },
            2: { cellWidth: 18, halign: "right" },
            3: { cellWidth: 26, halign: "right" },
            4: { cellWidth: 26, halign: "right" },
          },
        });
        y = ((doc as any).lastAutoTable?.finalY ?? y) + 6;
      }
    }
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

  const start = data.filters.startDate || "all";
  const end = data.filters.endDate || "all";
  const fileName = sanitizeFilename(`Sales_Report_${start}_to_${end}.pdf`);
  doc.save(fileName);
}

