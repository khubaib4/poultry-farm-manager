import React, { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, FileText, Egg, DollarSign, TrendingUp, Printer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { farms, owner, isElectron } from "@/lib/api";
import type { OwnerReportResult, OwnerReportType } from "@/types/electron";
import type { LucideIcon } from "lucide-react";

type OwnerFarmOption = { id: number; name: string };

function IconEl({
  Icon,
  className,
}: {
  Icon: LucideIcon;
  className?: string;
}): React.ReactElement {
  return React.createElement(Icon as React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>, {
    className,
    "aria-hidden": true,
  });
}

const REPORT_TABS: { id: OwnerReportType; label: string; Icon: LucideIcon }[] = [
  { id: "summary", label: "Summary", Icon: FileText },
  { id: "financial", label: "Financial", Icon: DollarSign },
  { id: "production", label: "Production", Icon: Egg },
  { id: "sales", label: "Sales", Icon: TrendingUp },
];

const TYPE_TITLES: Record<OwnerReportType, string> = {
  summary: "Summary report",
  financial: "Financial report",
  production: "Production report",
  sales: "Sales report",
};

function escapeCsvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function downloadOwnerReportCsv(report: OwnerReportResult): void {
  const lines: string[] = [];
  lines.push(`${escapeCsvCell("Report type")},${escapeCsvCell(report.type)}`);
  lines.push(`${escapeCsvCell("Period")},${escapeCsvCell(`${report.startDate} – ${report.endDate}`)}`);
  lines.push(`${escapeCsvCell("Scope")},${escapeCsvCell(report.scopeLabel)}`);
  lines.push("");
  lines.push(`${escapeCsvCell("Metric")},${escapeCsvCell("Value")}`);
  for (const s of report.summary) {
    lines.push(`${escapeCsvCell(s.label)},${escapeCsvCell(s.value)}`);
  }
  lines.push("");
  if (report.columns.length > 0 && report.rows.length > 0) {
    lines.push(report.columns.map(escapeCsvCell).join(","));
    for (const row of report.rows) {
      lines.push(report.columns.map((c) => escapeCsvCell(String(row[c] ?? ""))).join(","));
    }
  }
  for (const sec of report.sections ?? []) {
    lines.push("");
    lines.push(escapeCsvCell(sec.title));
    lines.push(sec.columns.map(escapeCsvCell).join(","));
    for (const row of sec.rows) {
      lines.push(sec.columns.map((c) => escapeCsvCell(String(row[c] ?? ""))).join(","));
    }
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `owner-report-${report.type}-${report.startDate}-to-${report.endDate}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildPrintHtml(report: OwnerReportResult): string {
  const table = (cols: string[], rows: Record<string, string>[]) => `
    <table>
      <thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((r) => `<tr>${cols.map((c) => `<td>${escapeHtml(String(r[c] ?? ""))}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `;
  const sectionsHtml = (report.sections ?? [])
    .map(
      (sec) => `
    <h3>${escapeHtml(sec.title)}</h3>
    ${table(sec.columns, sec.rows)}
  `
    )
    .join("");

  return `
    <h1>${escapeHtml(TYPE_TITLES[report.type])}</h1>
    <p class="meta">${escapeHtml(report.scopeLabel)} · ${escapeHtml(report.startDate)} – ${escapeHtml(report.endDate)}</p>
    <h2>Summary</h2>
    <table class="summary">
      <tbody>
        ${report.summary.map((s) => `<tr><td>${escapeHtml(s.label)}</td><td>${escapeHtml(s.value)}</td></tr>`).join("")}
      </tbody>
    </table>
    ${report.columns.length ? `<h2>By farm</h2>${table(report.columns, report.rows)}` : ""}
    ${sectionsHtml}
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function OwnerReportsPage(): React.ReactElement {
  const { user } = useAuth();
  const ownerId = user?.type === "owner" ? user.id : null;

  const [reportType, setReportType] = useState<OwnerReportType>("summary");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [selectedFarmId, setSelectedFarmId] = useState<number | "all">("all");
  const [farmsList, setFarmsList] = useState<OwnerFarmOption[]>([]);
  const [reportData, setReportData] = useState<OwnerReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const endStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setDateRange({ start: startStr, end: endStr });
  }, []);

  useEffect(() => {
    if (ownerId == null || !isElectron()) return;
    void farms
      .getAll(ownerId)
      .then((list) =>
        setFarmsList(
          (list as { id?: number; name?: string }[])
            .filter((f) => typeof f.id === "number")
            .map((f) => ({ id: f.id as number, name: String(f.name ?? "") }))
        )
      )
      .catch(() => setFarmsList([]));
  }, [ownerId]);

  const generateReport = useCallback(async () => {
    if (ownerId == null) return;
    setLoading(true);
    setError(null);
    try {
      const result = await owner.getReport(ownerId, {
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end,
        farmId: selectedFarmId === "all" ? undefined : selectedFarmId,
      });
      setReportData(result);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to generate report");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [ownerId, reportType, dateRange.start, dateRange.end, selectedFarmId]);

  const handlePrint = useCallback(() => {
    if (!reportData) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Owner report</title>
      <style>
        body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
        h1 { font-size: 22px; margin: 0 0 8px; color: #1a5276; }
        h2 { font-size: 16px; margin: 20px 0 8px; color: #2c3e50; }
        h3 { font-size: 14px; margin: 16px 0 8px; }
        .meta { color: #666; margin-bottom: 16px; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
        th { background: #1a5276; color: #fff; padding: 8px 6px; text-align: left; }
        td { padding: 6px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f8f9fa; }
        table.summary td:first-child { font-weight: 500; width: 40%; }
        @media print { body { margin: 12mm; } }
      </style></head><body>${buildPrintHtml(reportData)}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }, [reportData]);

  if (!isElectron()) {
    return (
      <div className="p-6 text-center text-gray-500">
        Owner reports are only available in the desktop app.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Consolidated analytics across all your farms (optional single-farm filter).
          </p>
        </div>
        {reportData && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadOwnerReportCsv(reportData)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
            >
              <IconEl Icon={FileSpreadsheet} className="w-4 h-4" />
              Export Excel (CSV)
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-800"
            >
              <IconEl Icon={Printer} className="w-4 h-4" />
              Print / PDF
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {REPORT_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setReportType(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              reportType === id
                ? "bg-primary text-primary-foreground"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <IconEl Icon={Icon} className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
            <select
              value={selectedFarmId === "all" ? "all" : String(selectedFarmId)}
              onChange={(e) =>
                setSelectedFarmId(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="all">All farms</option>
              {farmsList.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void generateReport()}
              disabled={loading || !dateRange.start || !dateRange.end || ownerId == null}
              className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate report"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[240px]">
        {!reportData ? (
          <div className="text-center py-16 text-gray-500">
            <IconEl Icon={FileText} className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-sm">Choose a report type and date range, then click Generate report.</p>
          </div>
        ) : (
          <ReportContent data={reportData} />
        )}
      </div>
    </div>
  );
}

function ReportContent({ data }: { data: OwnerReportResult }): React.ReactElement {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{TYPE_TITLES[data.type]}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {data.scopeLabel} · {data.startDate} – {data.endDate}
        </p>
      </div>

      {data.summary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {data.summary.map((s) => (
            <div key={s.label} className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-3">
              <p className="text-xs text-gray-500 truncate" title={s.label}>
                {s.label}
              </p>
              <p className="text-lg font-semibold text-gray-900 mt-1 break-words">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {data.columns.length > 0 && data.rows.length > 0 && (
        <div className="overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">By farm</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {data.columns.map((col) => (
                  <th key={col} className="text-left py-2 px-3 font-medium text-gray-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/80">
                  {data.columns.map((col) => (
                    <td key={col} className="py-2 px-3 text-gray-800">
                      {row[col] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(data.sections ?? []).map((sec) => (
        <div key={sec.title} className="overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">{sec.title}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {sec.columns.map((col) => (
                  <th key={col} className="text-left py-2 px-3 font-medium text-gray-700">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sec.rows.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/80">
                  {sec.columns.map((col) => (
                    <td key={col} className="py-2 px-3 text-gray-800">
                      {row[col] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
