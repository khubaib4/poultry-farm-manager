import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  FlockReportData,
  FinancialReportData,
} from "@/types/electron";

const COLORS = {
  primary: [26, 82, 118] as [number, number, number],
  headerBg: [26, 82, 118] as [number, number, number],
  headerText: [255, 255, 255] as [number, number, number],
  altRow: [245, 247, 250] as [number, number, number],
  text: [51, 51, 51] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  green: [39, 174, 96] as [number, number, number],
  red: [231, 76, 60] as [number, number, number],
};

function fmt(amount: number): string {
  return `Rs ${Number(amount ?? 0).toLocaleString()}`;
}

function sanitize(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\-. ]/g, "").replace(/\s+/g, "_");
}

function addHeader(doc: jsPDF, farmName: string, title: string, dateRange: string) {
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(farmName, 14, 20);

  doc.setFontSize(13);
  doc.setTextColor(...COLORS.text);
  doc.text(title, 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(dateRange, 14, 34);

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 37, doc.internal.pageSize.getWidth() - 14, 37);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const now = new Date().toLocaleString();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Page ${i} of ${pageCount}`, w / 2, h - 10, { align: "center" });
    doc.text(`Generated: ${now}`, 14, h - 10);
    doc.text("Poultry Farm Manager", w - 14, h - 10, { align: "right" });
  }
}

function addSummaryRow(doc: jsPDF, y: number, items: { label: string; value: string; color?: [number, number, number] }[]): number {
  const colW = (doc.internal.pageSize.getWidth() - 28) / items.length;
  items.forEach((item, i) => {
    const x = 14 + i * colW;
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, y, colW - 4, 22, 2, 2, "F");
    doc.setFontSize(14);
    doc.setTextColor(...(item.color || COLORS.text));
    doc.text(item.value, x + (colW - 4) / 2, y + 10, { align: "center" });
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(item.label, x + (colW - 4) / 2, y + 18, { align: "center" });
  });
  return y + 28;
}

function addSectionTitle(doc: jsPDF, y: number, title: string): number {
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 14, y);
  return y + 6;
}

function addAutoTable(doc: jsPDF, startY: number, head: string[][], body: (string | number)[][]): number {
  autoTable(doc, {
    startY,
    head,
    body,
    theme: "grid",
    headStyles: { fillColor: COLORS.headerBg, textColor: COLORS.headerText, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: COLORS.text },
    alternateRowStyles: { fillColor: COLORS.altRow },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
}

export function exportDailyReportPDF(data: DailyReportData, farmName: string) {
  const doc = new jsPDF();
  addHeader(doc, farmName, "Daily Summary Report", `Date: ${data.date}`);

  let y = addSummaryRow(doc, 42, [
    { label: "Total Birds", value: Number(data.totals.birds ?? 0).toLocaleString() },
    { label: "Total Eggs", value: Number(data.totals.eggsTotal ?? 0).toLocaleString() },
    { label: "Deaths", value: data.totals.deaths.toString(), color: data.totals.deaths > 0 ? COLORS.red : COLORS.text },
    { label: "Revenue", value: fmt(data.totals.revenue), color: COLORS.green },
  ]);

  y = addSectionTitle(doc, y, "Flock Breakdown");
  y = addAutoTable(doc, y,
    [["Flock", "Breed", "Birds", "Grade A", "Grade B", "Cracked", "Total Eggs", "Deaths", "Feed (kg)"]],
    data.flocks.map(f => [
      f.batchName, f.breed || "—", f.currentCount, f.eggsGradeA, f.eggsGradeB, f.eggsCracked,
      f.eggsGradeA + f.eggsGradeB + f.eggsCracked, f.deaths, f.feedConsumedKg,
    ])
  );

  y = addSectionTitle(doc, y, "Financial Summary");
  addAutoTable(doc, y,
    [["Metric", "Value"]],
    [
      ["Revenue", fmt(data.totals.revenue)],
      ["Expenses", fmt(data.totals.expenses)],
      ["Net Profit/Loss", fmt(data.totals.revenue - data.totals.expenses)],
      ["Feed Consumed", `${data.totals.feedKg} kg`],
    ]
  );

  if (data.notes.length > 0) {
    const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    addSectionTitle(doc, lastY, "Notes");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.text);
    data.notes.forEach((n, i) => {
      doc.text(`• ${n}`, 16, lastY + 6 + i * 5);
    });
  }

  addFooter(doc);
  doc.save(sanitize(`${farmName}_Daily_${data.date}.pdf`));
}

export function exportWeeklyReportPDF(data: WeeklyReportData, farmName: string) {
  const doc = new jsPDF();
  addHeader(doc, farmName, "Weekly Performance Report", `Period: ${data.startDate} to ${data.endDate}`);

  let y = addSummaryRow(doc, 42, [
    { label: "Total Birds", value: Number(data.weeklyTotals.birds ?? 0).toLocaleString() },
    { label: "Total Eggs", value: Number(data.weeklyTotals.eggsTotal ?? 0).toLocaleString() },
    { label: "Avg Eggs/Day", value: data.averages.eggsPerDay.toString() },
    { label: "Net Profit", value: fmt(data.financial.profit), color: data.financial.profit >= 0 ? COLORS.green : COLORS.red },
  ]);

  y = addSectionTitle(doc, y, "Daily Breakdown");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  y = addAutoTable(doc, y,
    [["Day", "Date", "Grade A", "Grade B", "Cracked", "Total", "Deaths", "Feed (kg)"]],
    data.dailyData.map(d => [
      dayNames[new Date(d.date).getDay()], d.date, d.eggsGradeA, d.eggsGradeB, d.eggsCracked, d.eggsTotal, d.deaths, Number(d.feedKg ?? 0).toFixed(1),
    ])
  );

  y = addSectionTitle(doc, y, "Performance Averages");
  y = addAutoTable(doc, y,
    [["Metric", "Value"]],
    [
      ["Avg Eggs/Day", data.averages.eggsPerDay.toString()],
      ["Mortality Rate", `${data.averages.mortalityRate}%`],
      ["Feed/Bird/Day", `${(data.averages.feedPerBird * 1000).toFixed(0)}g`],
    ]
  );

  y = addSectionTitle(doc, y, "Financial Summary");
  addAutoTable(doc, y,
    [["Metric", "Value"]],
    [
      ["Revenue", fmt(data.financial.revenue)],
      ["Expenses", fmt(data.financial.expenses)],
      ["Net Profit/Loss", fmt(data.financial.profit)],
    ]
  );

  addFooter(doc);
  doc.save(sanitize(`${farmName}_Weekly_${data.startDate}_to_${data.endDate}.pdf`));
}

export function exportMonthlyReportPDF(data: MonthlyReportData, farmName: string) {
  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const doc = new jsPDF();
  addHeader(doc, farmName, "Monthly Summary Report", `${monthNames[data.month]} ${data.year}`);

  let y = addSummaryRow(doc, 42, [
    { label: "Current Birds", value: Number(data.totals.birds ?? 0).toLocaleString() },
    { label: "Total Eggs", value: Number(data.totals.eggsTotal ?? 0).toLocaleString() },
    { label: "Production Rate", value: `${data.averages.productionRate}%` },
    { label: "Net Profit", value: fmt(data.financial.profit), color: data.financial.profit >= 0 ? COLORS.green : COLORS.red },
  ]);

  y = addSectionTitle(doc, y, "Weekly Breakdown");
  y = addAutoTable(doc, y,
    [["Week", "Eggs", "Deaths", "Feed (kg)", "Expenses"]],
    data.weeklyData.map(w => [
      `${w.weekStart} — ${w.weekEnd}`, Number(w.eggsTotal ?? 0).toLocaleString(), w.deaths, Number(w.feedKg ?? 0).toFixed(1), fmt(w.expenses),
    ])
  );

  y = addSectionTitle(doc, y, "Egg Production by Grade");
  y = addAutoTable(doc, y,
    [["Grade", "Quantity"]],
    [
      ["Grade A", Number(data.totals.eggsGradeA ?? 0).toLocaleString()],
      ["Grade B", Number(data.totals.eggsGradeB ?? 0).toLocaleString()],
      ["Cracked", Number(data.totals.eggsCracked ?? 0).toLocaleString()],
      ["Total", Number(data.totals.eggsTotal ?? 0).toLocaleString()],
    ]
  );

  y = addSectionTitle(doc, y, "Financial Summary");
  const finRows: (string | number)[][] = [
    ["Total Revenue", fmt(data.financial.revenue)],
    ["Total Expenses", fmt(data.financial.expenses)],
  ];
  data.financial.expensesByCategory.forEach(ec => {
    finRows.push([`  ${ec.category}`, fmt(ec.amount)]);
  });
  finRows.push(["Net Profit/Loss", fmt(data.financial.profit)]);
  y = addAutoTable(doc, y, [["Item", "Amount"]], finRows);

  y = addSectionTitle(doc, y, "Status Summary");
  addAutoTable(doc, y,
    [["Area", "Status"]],
    [
      ["Inventory Items", data.inventory.totalItems.toString()],
      ["Low Stock Items", data.inventory.lowStock.toString()],
      ["Expiring Soon", data.inventory.expiringSoon.toString()],
      ["Vaccination Compliance", `${data.vaccination.complianceRate}% (${data.vaccination.completed}/${data.vaccination.total})`],
    ]
  );

  addFooter(doc);
  doc.save(sanitize(`${farmName}_Monthly_${monthNames[data.month]}_${data.year}.pdf`));
}

export function exportFlockReportPDF(data: FlockReportData, farmName: string) {
  const doc = new jsPDF();
  addHeader(doc, farmName, "Flock Performance Report", `${data.flock.batchName} — ${data.flock.breed || "Unknown Breed"}`);

  let y = addSummaryRow(doc, 42, [
    { label: "Total Eggs", value: Number(data.stats.totalEggs ?? 0).toLocaleString() },
    { label: "Production Rate", value: `${data.stats.productionRate}%` },
    { label: "Mortality Rate", value: `${data.stats.mortalityRate}%`, color: data.stats.mortalityRate > 5 ? COLORS.red : COLORS.text },
    { label: "Feed/Egg (kg)", value: data.stats.feedConversionRatio.toString() },
  ]);

  y = addSectionTitle(doc, y, "Flock Information");
  y = addAutoTable(doc, y,
    [["Property", "Value"]],
    [
      ["Batch Name", data.flock.batchName],
      ["Breed", data.flock.breed || "—"],
      ["Age", `${data.flock.ageDays} days`],
      ["Status", data.flock.status || "—"],
      ["Initial Count", Number(data.flock.initialCount ?? 0).toLocaleString()],
      ["Current Count", Number(data.flock.currentCount ?? 0).toLocaleString()],
      ["Arrival Date", data.flock.arrivalDate],
      ["Days Tracked", data.stats.daysTracked.toString()],
    ]
  );

  y = addSectionTitle(doc, y, "Lifetime Statistics");
  y = addAutoTable(doc, y,
    [["Metric", "Value"]],
    [
      ["Grade A Eggs", Number(data.stats.totalEggsA ?? 0).toLocaleString()],
      ["Grade B Eggs", Number(data.stats.totalEggsB ?? 0).toLocaleString()],
      ["Cracked Eggs", Number(data.stats.totalCracked ?? 0).toLocaleString()],
      ["Total Eggs", Number(data.stats.totalEggs ?? 0).toLocaleString()],
      ["Total Deaths", data.stats.totalDeaths.toString()],
      ["Total Feed", `${data.stats.totalFeed} kg`],
    ]
  );

  if (data.vaccinations.records.length > 0) {
    y = addSectionTitle(doc, y, `Vaccinations (${data.vaccinations.complianceRate}% Compliance)`);
    addAutoTable(doc, y,
      [["Vaccine", "Scheduled", "Administered", "Status"]],
      data.vaccinations.records.map(v => [
        v.vaccineName, v.scheduledDate, v.administeredDate || "—", v.status || "—",
      ])
    );
  }

  addFooter(doc);
  doc.save(sanitize(`${farmName}_Flock_${data.flock.batchName}.pdf`));
}

export function exportFinancialReportPDF(data: FinancialReportData, farmName: string) {
  const doc = new jsPDF();
  addHeader(doc, farmName, "Financial Report", `Period: ${data.startDate} to ${data.endDate}`);

  let y = addSummaryRow(doc, 42, [
    { label: "Revenue", value: fmt(data.revenue.total), color: COLORS.green },
    { label: "Expenses", value: fmt(data.expenses.total), color: COLORS.red },
    { label: "Net Profit/Loss", value: fmt(data.profitLoss.profit), color: data.profitLoss.profit >= 0 ? COLORS.green : COLORS.red },
    { label: "Margin", value: `${data.profitLoss.margin}%` },
  ]);

  if (data.revenue.byCustomer.length > 0) {
    y = addSectionTitle(doc, y, "Revenue by Customer");
    y = addAutoTable(doc, y,
      [["Customer", "Revenue", "% of Total"]],
      data.revenue.byCustomer.map(c => [
        c.name, fmt(c.amount),
        data.revenue.total > 0 ? `${Math.round((c.amount / data.revenue.total) * 100)}%` : "0%",
      ])
    );
  }

  if (data.revenue.byProduct.length > 0) {
    y = addSectionTitle(doc, y, "Revenue by Product");
    y = addAutoTable(doc, y,
      [["Product", "Revenue", "% of Total"]],
      data.revenue.byProduct.map(p => [
        p.name, fmt(p.amount),
        data.revenue.total > 0 ? `${Math.round((p.amount / data.revenue.total) * 100)}%` : "0%",
      ])
    );
  }

  y = addSectionTitle(doc, y, "Expenses by Category");
  y = addAutoTable(doc, y,
    [["Category", "Amount", "% of Total"]],
    [...data.expenses.byCategory].sort((a, b) => b.amount - a.amount).map(ec => [
      ec.category, fmt(ec.amount),
      data.expenses.total > 0 ? `${Math.round((ec.amount / data.expenses.total) * 100)}%` : "0%",
    ])
  );

  y = addSectionTitle(doc, y, "Profit & Loss Statement");
  const plRows: (string | number)[][] = [
    ["Sales Revenue", `${data.revenue.salesCount} sales`, fmt(data.revenue.total)],
  ];
  data.revenue.byProduct.forEach(p => {
    plRows.push([`  ${p.name}`, "", fmt(p.amount)]);
  });
  plRows.push(["Expenses", "", fmt(data.expenses.total)]);
  data.expenses.byCategory.forEach(ec => {
    plRows.push([`  ${ec.category}`, "", fmt(ec.amount)]);
  });
  plRows.push(["Net Profit/Loss", "", fmt(data.profitLoss.profit)]);
  y = addAutoTable(doc, y, [["Item", "Details", "Amount"]], plRows);

  y = addSectionTitle(doc, y, "Collections");
  y = addAutoTable(doc, y,
    [["Item", "Amount"]],
    [
      ["Total Billed", fmt(data.revenue.total)],
      ["Total Collected", fmt(data.revenue.totalCollected)],
      ["Outstanding", fmt(data.revenue.outstanding)],
      ["Collection Rate", `${data.revenue.collectionRate}%`],
    ]
  );

  y = addSectionTitle(doc, y, "Per-Unit Metrics");
  addAutoTable(doc, y,
    [["Metric", "Value"]],
    [
      ["Revenue/Bird", fmt(data.metrics.revenuePerBird)],
      ["Expense/Bird", fmt(data.metrics.expensePerBird)],
      ["Profit/Bird", fmt(data.metrics.profitPerBird)],
      ["Revenue/Egg", fmt(data.metrics.revenuePerEgg)],
      ["Cost/Egg", fmt(data.metrics.costPerEgg)],
      ["Total Birds", Number(data.metrics.totalBirds ?? 0).toLocaleString()],
      ["Total Eggs", Number(data.metrics.totalEggs ?? 0).toLocaleString()],
    ]
  );

  addFooter(doc);
  doc.save(sanitize(`${farmName}_Financial_${data.startDate}_to_${data.endDate}.pdf`));
}
