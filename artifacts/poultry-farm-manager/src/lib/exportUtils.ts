import type { VaccinationExportItem } from "@/types/electron";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function generateVaccinationCSV(data: VaccinationExportItem[]): string {
  const headers = ["Date", "Flock", "Vaccine", "Status", "Administered By", "Batch Number", "Notes"];
  const rows = data.map(row => [
    row.date,
    `"${row.flock.replace(/"/g, '""')}"`,
    `"${row.vaccine.replace(/"/g, '""')}"`,
    row.status,
    `"${row.administeredBy.replace(/"/g, '""')}"`,
    `"${row.batchNumber.replace(/"/g, '""')}"`,
    `"${(row.notes || "").replace(/"/g, '""')}"`,
  ]);
  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

export function generateVaccinationPDFContent(
  data: VaccinationExportItem[],
  meta: { farmName: string; dateRange?: string; generatedDate: string }
): string {
  const totalCompleted = data.filter(d => d.status === "completed").length;
  const totalSkipped = data.filter(d => d.status === "skipped").length;
  const total = data.length;
  const complianceRate = total > 0 ? Math.round((totalCompleted / total) * 100) : 0;

  let html = `
<!DOCTYPE html>
<html>
<head>
<title>Vaccination Report</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
  h1 { color: #1a5276; border-bottom: 2px solid #1a5276; padding-bottom: 10px; }
  .meta { color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
  th { background: #1a5276; color: white; padding: 8px 6px; text-align: left; }
  td { padding: 6px; border-bottom: 1px solid #ddd; }
  tr:nth-child(even) { background: #f8f9fa; }
  .summary { margin-top: 30px; display: flex; gap: 20px; }
  .summary-card { background: #f0f4f8; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
  .summary-card .value { font-size: 24px; font-weight: bold; color: #1a5276; }
  .summary-card .label { font-size: 12px; color: #666; }
  .status-completed { color: #27ae60; font-weight: bold; }
  .status-skipped { color: #e74c3c; font-weight: bold; }
  .status-pending { color: #f39c12; font-weight: bold; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>Vaccination Report — ${escapeHtml(meta.farmName)}</h1>
<div class="meta">
  ${meta.dateRange ? `<p>Period: ${escapeHtml(meta.dateRange)}</p>` : ""}
  <p>Generated: ${escapeHtml(meta.generatedDate)}</p>
</div>
<div class="summary">
  <div class="summary-card"><div class="value">${total}</div><div class="label">Total Vaccinations</div></div>
  <div class="summary-card"><div class="value">${totalCompleted}</div><div class="label">Completed</div></div>
  <div class="summary-card"><div class="value">${totalSkipped}</div><div class="label">Skipped</div></div>
  <div class="summary-card"><div class="value">${complianceRate}%</div><div class="label">Compliance Rate</div></div>
</div>
<table>
  <thead>
    <tr><th>Date</th><th>Flock</th><th>Vaccine</th><th>Status</th><th>Administered By</th><th>Batch #</th><th>Notes</th></tr>
  </thead>
  <tbody>`;

  for (const row of data) {
    const statusClass = `status-${row.status}`;
    html += `
    <tr>
      <td>${escapeHtml(row.date)}</td>
      <td>${escapeHtml(row.flock)}</td>
      <td>${escapeHtml(row.vaccine)}</td>
      <td class="${statusClass}">${escapeHtml(row.status)}</td>
      <td>${escapeHtml(row.administeredBy || "—")}</td>
      <td>${escapeHtml(row.batchNumber || "—")}</td>
      <td>${escapeHtml(row.notes || "—")}</td>
    </tr>`;
  }

  html += `
  </tbody>
</table>
</body>
</html>`;
  return html;
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadPDFViaWindow(htmlContent: string, filename: string) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.replace(".pdf", ".html");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
