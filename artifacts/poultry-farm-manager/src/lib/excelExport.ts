import * as XLSX from "xlsx";
import type {
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  FlockReportData,
  FinancialReportData,
} from "@/types/electron";

function sanitize(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9_\-. ]/g, "").replace(/\s+/g, "_");
}

function createWB(): XLSX.WorkBook {
  return XLSX.utils.book_new();
}

function addSheet(wb: XLSX.WorkBook, name: string, data: unknown[][], colWidths?: number[]) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  if (colWidths) {
    ws["!cols"] = colWidths.map(w => ({ wch: w }));
  }
  XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
}

function downloadWB(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

export function exportDailyReportExcel(data: DailyReportData, farmName: string) {
  const wb = createWB();

  addSheet(wb, "Summary", [
    ["Daily Summary Report"],
    ["Farm", farmName],
    ["Date", data.date],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Metric", "Value"],
    ["Total Birds", data.totals.birds],
    ["Total Eggs (Grade A)", data.totals.eggsGradeA],
    ["Total Eggs (Grade B)", data.totals.eggsGradeB],
    ["Total Eggs (Cracked)", data.totals.eggsCracked],
    ["Total Eggs", data.totals.eggsTotal],
    ["Deaths", data.totals.deaths],
    ["Feed (kg)", data.totals.feedKg],
    ["Revenue (Rs)", data.totals.revenue],
    ["Expenses (Rs)", data.totals.expenses],
    ["Net Profit/Loss (Rs)", data.totals.revenue - data.totals.expenses],
  ], [25, 20]);

  addSheet(wb, "Flock Breakdown", [
    ["Flock", "Breed", "Birds", "Grade A", "Grade B", "Cracked", "Total Eggs", "Deaths", "Feed (kg)", "Death Cause", "Notes"],
    ...data.flocks.map(f => [
      f.batchName, f.breed || "", f.currentCount, f.eggsGradeA, f.eggsGradeB, f.eggsCracked,
      f.eggsGradeA + f.eggsGradeB + f.eggsCracked, f.deaths, f.feedConsumedKg, f.deathCause || "", f.notes || "",
    ]),
  ], [18, 15, 10, 10, 10, 10, 12, 10, 12, 15, 25]);

  downloadWB(wb, sanitize(`${farmName}_Daily_${data.date}.xlsx`));
}

export function exportWeeklyReportExcel(data: WeeklyReportData, farmName: string) {
  const wb = createWB();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  addSheet(wb, "Summary", [
    ["Weekly Performance Report"],
    ["Farm", farmName],
    ["Period", `${data.startDate} to ${data.endDate}`],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Metric", "Value"],
    ["Total Birds", data.weeklyTotals.birds],
    ["Total Eggs", data.weeklyTotals.eggsTotal],
    ["Total Deaths", data.weeklyTotals.deaths],
    ["Total Feed (kg)", data.weeklyTotals.feedKg],
    ["Avg Eggs/Day", data.averages.eggsPerDay],
    ["Mortality Rate (%)", data.averages.mortalityRate],
    ["Feed/Bird/Day (g)", (data.averages.feedPerBird * 1000).toFixed(0)],
    [],
    ["Financial Summary"],
    ["Revenue (Rs)", data.financial.revenue],
    ["Expenses (Rs)", data.financial.expenses],
    ["Net Profit/Loss (Rs)", data.financial.profit],
  ], [25, 20]);

  addSheet(wb, "Daily Data", [
    ["Day", "Date", "Grade A", "Grade B", "Cracked", "Total Eggs", "Deaths", "Feed (kg)"],
    ...data.dailyData.map(d => [
      dayNames[new Date(d.date).getDay()], d.date, d.eggsGradeA, d.eggsGradeB, d.eggsCracked, d.eggsTotal, d.deaths, d.feedKg,
    ]),
  ], [8, 12, 10, 10, 10, 12, 10, 12]);

  downloadWB(wb, sanitize(`${farmName}_Weekly_${data.startDate}_to_${data.endDate}.xlsx`));
}

export function exportMonthlyReportExcel(data: MonthlyReportData, farmName: string) {
  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const wb = createWB();

  addSheet(wb, "Summary", [
    ["Monthly Summary Report"],
    ["Farm", farmName],
    ["Period", `${monthNames[data.month]} ${data.year}`],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Production Summary"],
    ["Total Birds", data.totals.birds],
    ["Total Eggs", data.totals.eggsTotal],
    ["Grade A", data.totals.eggsGradeA],
    ["Grade B", data.totals.eggsGradeB],
    ["Cracked", data.totals.eggsCracked],
    ["Deaths", data.totals.deaths],
    ["Feed (kg)", data.totals.feedKg],
    ["Avg Eggs/Day", data.averages.eggsPerDay],
    ["Production Rate (%)", data.averages.productionRate],
    [],
    ["Financial Summary"],
    ["Revenue (Rs)", data.financial.revenue],
    ["Expenses (Rs)", data.financial.expenses],
    ["Net Profit/Loss (Rs)", data.financial.profit],
    [],
    ["Expenses by Category"],
    ...data.financial.expensesByCategory.map(ec => [ec.category, ec.amount]),
    [],
    ["Status"],
    ["Inventory Items", data.inventory.totalItems],
    ["Low Stock", data.inventory.lowStock],
    ["Expiring Soon", data.inventory.expiringSoon],
    ["Vaccination Compliance (%)", data.vaccination.complianceRate],
  ], [25, 20]);

  addSheet(wb, "Weekly Data", [
    ["Week Start", "Week End", "Eggs", "Deaths", "Feed (kg)", "Expenses (Rs)"],
    ...data.weeklyData.map(w => [w.weekStart, w.weekEnd, w.eggsTotal, w.deaths, w.feedKg, w.expenses]),
  ], [12, 12, 10, 10, 12, 15]);

  downloadWB(wb, sanitize(`${farmName}_Monthly_${monthNames[data.month]}_${data.year}.xlsx`));
}

export function exportFlockReportExcel(data: FlockReportData, farmName: string) {
  const wb = createWB();

  addSheet(wb, "Summary", [
    ["Flock Performance Report"],
    ["Farm", farmName],
    ["Batch", data.flock.batchName],
    ["Breed", data.flock.breed || "Unknown"],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Flock Information"],
    ["Initial Count", data.flock.initialCount],
    ["Current Count", data.flock.currentCount || 0],
    ["Age (days)", data.flock.ageDays],
    ["Status", data.flock.status || ""],
    ["Arrival Date", data.flock.arrivalDate],
    ["Days Tracked", data.stats.daysTracked],
    [],
    ["Lifetime Statistics"],
    ["Total Eggs", data.stats.totalEggs],
    ["Grade A Eggs", data.stats.totalEggsA],
    ["Grade B Eggs", data.stats.totalEggsB],
    ["Cracked Eggs", data.stats.totalCracked],
    ["Total Deaths", data.stats.totalDeaths],
    ["Total Feed (kg)", data.stats.totalFeed],
    ["Mortality Rate (%)", data.stats.mortalityRate],
    ["Production Rate (%)", data.stats.productionRate],
    ["Feed Conversion Ratio", data.stats.feedConversionRatio],
    [],
    ["Vaccination Compliance (%)", data.vaccinations.complianceRate],
    ["Vaccinations Completed", data.vaccinations.completed],
    ["Total Vaccinations", data.vaccinations.total],
  ], [25, 20]);

  addSheet(wb, "Production Data", [
    ["Date", "Eggs", "Deaths", "Feed (kg)"],
    ...data.productionCurve.map(p => [p.date, p.eggs, p.deaths, p.feedKg]),
  ], [12, 10, 10, 12]);

  if (data.vaccinations.records.length > 0) {
    addSheet(wb, "Vaccinations", [
      ["Vaccine", "Scheduled Date", "Administered Date", "Status"],
      ...data.vaccinations.records.map(v => [v.vaccineName, v.scheduledDate, v.administeredDate || "", v.status || ""]),
    ], [20, 15, 15, 12]);
  }

  downloadWB(wb, sanitize(`${farmName}_Flock_${data.flock.batchName}.xlsx`));
}

export function exportFinancialReportExcel(data: FinancialReportData, farmName: string) {
  const wb = createWB();

  addSheet(wb, "Summary", [
    ["Financial Report"],
    ["Farm", farmName],
    ["Period", `${data.startDate} to ${data.endDate}`],
    ["Generated", new Date().toLocaleString()],
    [],
    ["Overview"],
    ["Total Revenue (Rs)", data.revenue.total],
    ["Total Expenses (Rs)", data.expenses.total],
    ["Net Profit/Loss (Rs)", data.profitLoss.profit],
    ["Profit Margin (%)", data.profitLoss.margin],
    [],
    ["Per-Unit Metrics"],
    ["Revenue/Bird (Rs)", data.metrics.revenuePerBird],
    ["Expense/Bird (Rs)", data.metrics.expensePerBird],
    ["Profit/Bird (Rs)", data.metrics.profitPerBird],
    ["Revenue/Egg (Rs)", data.metrics.revenuePerEgg],
    ["Cost/Egg (Rs)", data.metrics.costPerEgg],
    ["Total Birds", data.metrics.totalBirds],
    ["Total Eggs", data.metrics.totalEggs],
  ], [25, 20]);

  addSheet(wb, "Revenue", [
    ["Revenue by Egg Grade"],
    ["Grade", "Eggs", "Price/Egg (Rs)", "Revenue (Rs)", "% of Total"],
    ...data.revenue.byGrade.map(g => [
      `Grade ${g.grade}`, g.eggs, g.pricePerEgg, g.revenue,
      data.revenue.total > 0 ? `${Math.round((g.revenue / data.revenue.total) * 100)}%` : "0%",
    ]),
    ["Total", data.metrics.totalEggs, "", data.revenue.total, "100%"],
  ], [15, 10, 15, 15, 12]);

  addSheet(wb, "Expenses", [
    ["Expenses by Category"],
    ["Category", "Amount (Rs)", "% of Total"],
    ...[...data.expenses.byCategory].sort((a, b) => b.amount - a.amount).map(ec => [
      ec.category, ec.amount,
      data.expenses.total > 0 ? `${Math.round((ec.amount / data.expenses.total) * 100)}%` : "0%",
    ]),
    ["Total", data.expenses.total, "100%"],
  ], [20, 15, 12]);

  if (data.dailyTrend.length > 0) {
    addSheet(wb, "Daily Trend", [
      ["Date", "Revenue (Rs)", "Expenses (Rs)", "Net (Rs)"],
      ...data.dailyTrend.map(d => [d.date, d.revenue, d.expenses, d.revenue - d.expenses]),
    ], [12, 15, 15, 15]);
  }

  downloadWB(wb, sanitize(`${farmName}_Financial_${data.startDate}_to_${data.endDate}.xlsx`));
}
