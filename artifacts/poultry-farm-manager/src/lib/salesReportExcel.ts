import * as XLSX from "xlsx";
import { formatCurrency } from "@/lib/utils";
import type { SalesSummaryReport, CustomerHistoryReport, TopCustomer } from "@/types/electron";

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  const data = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSalesSummaryExcel(data: SalesSummaryReport, dateRange: { start: string; end: string }) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Sales Summary Report"],
    [`Period: ${dateRange.start} to ${dateRange.end}`],
    [],
    ["Metric", "Value"],
    ["Total Sales", data.totals.salesCount],
    ["Total Revenue", data.totals.totalAmount],
    ["Total Collected", data.totals.totalCollected],
    ["Total Outstanding", data.totals.totalOutstanding],
    ["Average Sale Value", data.totals.averageSaleValue],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  if (data.dailyBreakdown.length > 0) {
    const dailyData = [
      ["Date", "Sales Count", "Amount", "Collected"],
      ...data.dailyBreakdown.map(d => [d.date, d.salesCount, d.amount, d.collected]),
    ];
    const dailyWs = XLSX.utils.aoa_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, dailyWs, "Daily Breakdown");
  }

  if (data.paymentMethods.length > 0) {
    const pmData = [
      ["Payment Method", "Transactions", "Amount", "Percentage"],
      ...data.paymentMethods.map(p => [
        p.method.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
        p.count, p.amount, `${p.percentage}%`,
      ]),
    ];
    const pmWs = XLSX.utils.aoa_to_sheet(pmData);
    XLSX.utils.book_append_sheet(wb, pmWs, "Payment Methods");
  }

  if (data.gradeBreakdown.length > 0) {
    const gradeData = [
      ["Grade", "Eggs Qty", "Eggs Amount", "Trays Qty", "Trays Amount"],
      ...data.gradeBreakdown.map(g => [g.grade, g.eggsQty, g.eggsAmount, g.traysQty, g.traysAmount]),
    ];
    const gradeWs = XLSX.utils.aoa_to_sheet(gradeData);
    XLSX.utils.book_append_sheet(wb, gradeWs, "Grade Breakdown");
  }

  downloadWorkbook(wb, `Sales_Summary_${dateRange.start}_${dateRange.end}.xlsx`);
}

export function exportCustomerHistoryExcel(data: CustomerHistoryReport) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Customer Sales Report"],
    [`Customer: ${data.customer.name}`],
    [`Business: ${data.customer.businessName || "—"}`],
    [`Period: ${data.period.start} to ${data.period.end}`],
    [],
    ["Metric", "Value"],
    ["Total Orders", data.totals.salesCount],
    ["Total Purchases", data.totals.totalPurchases],
    ["Total Paid", data.totals.totalPaid],
    ["Balance Due", data.totals.balanceDue],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  if (data.sales.length > 0) {
    const salesData = [
      ["Invoice", "Date", "Items", "Amount", "Paid", "Balance", "Status"],
      ...data.sales.map(s => [
        s.invoiceNumber, s.saleDate,
        s.items.map(i => `${i.quantity} ${i.itemType} (${i.grade})`).join("; "),
        s.totalAmount, s.paidAmount, s.balanceDue, s.paymentStatus,
      ]),
    ];
    const salesWs = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesWs, "Sales");
  }

  if (data.payments.length > 0) {
    const paymentsData = [
      ["Date", "Invoice", "Method", "Amount"],
      ...data.payments.map(p => [
        p.paymentDate, p.invoiceNumber,
        p.paymentMethod.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()),
        p.amount,
      ]),
    ];
    const paymentsWs = XLSX.utils.aoa_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, paymentsWs, "Payments");
  }

  const safeName = data.customer.name.replace(/[^a-zA-Z0-9]/g, "_");
  downloadWorkbook(wb, `Customer_${safeName}_${data.period.start}_${data.period.end}.xlsx`);
}

export function exportTopCustomersExcel(data: TopCustomer[], dateRange: { start: string; end: string }) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ["Rank", "Customer", "Business", "Category", "Total Purchases", "Total Paid", "Balance Due", "Sales Count", "Last Purchase"],
    ...data.map(c => [
      c.rank, c.customerName, c.businessName || "—", c.category,
      c.totalPurchases, c.totalPaid, c.balanceDue, c.salesCount, c.lastPurchase || "—",
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Top Customers");

  downloadWorkbook(wb, `Top_Customers_${dateRange.start}_${dateRange.end}.xlsx`);
}
