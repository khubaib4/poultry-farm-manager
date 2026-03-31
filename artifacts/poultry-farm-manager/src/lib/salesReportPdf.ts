import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "@/lib/utils";
import type { SalesSummaryReport, CustomerHistoryReport, TopCustomer } from "@/types/electron";

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  doc.setFontSize(18);
  doc.setTextColor(22, 163, 74);
  doc.text(title, 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(subtitle, 14, 28);
  doc.setDrawColor(22, 163, 74);
  doc.setLineWidth(0.5);
  doc.line(14, 32, doc.internal.pageSize.getWidth() - 14, 32);
}

export function generateSalesSummaryPDF(data: SalesSummaryReport, dateRange: { start: string; end: string }): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, "Sales Summary Report", `Period: ${dateRange.start} to ${dateRange.end}`);

  let y = 40;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const summaryItems = [
    ["Total Sales", data.totals.salesCount.toString()],
    ["Total Revenue", formatCurrency(data.totals.totalAmount)],
    ["Total Collected", formatCurrency(data.totals.totalCollected)],
    ["Total Outstanding", formatCurrency(data.totals.totalOutstanding)],
    ["Average Sale Value", formatCurrency(data.totals.averageSaleValue)],
  ];
  for (const [label, value] of summaryItems) {
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 80, y);
    y += 7;
  }

  if (data.dailyBreakdown.length > 0) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Date", "Sales", "Amount", "Collected"]],
      body: data.dailyBreakdown.map(d => [
        d.date,
        d.salesCount.toString(),
        formatCurrency(d.amount),
        formatCurrency(d.collected),
      ]),
      headStyles: { fillColor: [22, 163, 74] },
      styles: { fontSize: 9 },
    });
  }

  if (data.paymentMethods.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || y + 10;
    autoTable(doc, {
      startY: finalY + 10,
      head: [["Payment Method", "Transactions", "Amount", "Percentage"]],
      body: data.paymentMethods.map(p => [
        p.method.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
        p.count.toString(),
        formatCurrency(p.amount),
        `${p.percentage}%`,
      ]),
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.getHeight() - 10);

  return doc;
}

export function generateCustomerReportPDF(data: CustomerHistoryReport): jsPDF {
  const doc = new jsPDF();
  addHeader(doc, "Customer Sales Report", `${data.customer.name} — ${data.period.start} to ${data.period.end}`);

  let y = 40;
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  if (data.customer.businessName) {
    doc.text(`Business: ${data.customer.businessName}`, 14, y);
    y += 6;
  }
  if (data.customer.phone) {
    doc.text(`Phone: ${data.customer.phone}`, 14, y);
    y += 6;
  }
  y += 4;

  const summaryItems = [
    ["Total Orders", data.totals.salesCount.toString()],
    ["Total Purchases", formatCurrency(data.totals.totalPurchases)],
    ["Total Paid", formatCurrency(data.totals.totalPaid)],
    ["Balance Due", formatCurrency(data.totals.balanceDue)],
  ];
  for (const [label, value] of summaryItems) {
    doc.setFont("helvetica", "bold");
    doc.text(label + ":", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 70, y);
    y += 7;
  }

  if (data.sales.length > 0) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Invoice", "Date", "Amount", "Paid", "Balance", "Status"]],
      body: data.sales.map(s => [
        s.invoiceNumber,
        s.saleDate,
        formatCurrency(s.totalAmount),
        formatCurrency(s.paidAmount),
        formatCurrency(s.balanceDue),
        s.paymentStatus,
      ]),
      headStyles: { fillColor: [22, 163, 74] },
      styles: { fontSize: 9 },
    });
  }

  if (data.payments.length > 0) {
    const finalY = (doc as any).lastAutoTable?.finalY || y + 10;
    autoTable(doc, {
      startY: finalY + 10,
      head: [["Date", "Invoice", "Method", "Amount"]],
      body: data.payments.map(p => [
        p.paymentDate,
        p.invoiceNumber,
        p.paymentMethod.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
        formatCurrency(p.amount),
      ]),
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.getHeight() - 10);

  return doc;
}

export function generateTopCustomersPDF(data: TopCustomer[], dateRange: { start: string; end: string }): jsPDF {
  const doc = new jsPDF("landscape");
  addHeader(doc, "Top Customers Report", `Period: ${dateRange.start} to ${dateRange.end}`);

  autoTable(doc, {
    startY: 40,
    head: [["Rank", "Customer", "Business", "Category", "Total Purchases", "Total Paid", "Balance Due", "Sales", "Last Purchase"]],
    body: data.map(c => [
      c.rank.toString(),
      c.customerName,
      c.businessName || "—",
      c.category,
      formatCurrency(c.totalPurchases),
      formatCurrency(c.totalPaid),
      formatCurrency(c.balanceDue),
      c.salesCount.toString(),
      c.lastPurchase || "—",
    ]),
    headStyles: { fillColor: [22, 163, 74] },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 12 },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.getHeight() - 10);

  return doc;
}
