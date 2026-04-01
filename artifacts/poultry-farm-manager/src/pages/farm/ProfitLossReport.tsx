import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { useFinancialData } from "@/hooks/useFinancialData";
import { ArrowLeft, Printer, Download } from "lucide-react";
import PLStatement from "@/components/financial/PLStatement";
import type { ProfitLossData } from "@/types/electron";

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getMonthEnd(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split("T")[0];
}

function getLastMonthStart(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getLastMonthEnd(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth(), 0);
  return last.toISOString().split("T")[0];
}

function getQuarterStart(): string {
  const d = new Date();
  const qMonth = Math.floor(d.getMonth() / 3) * 3;
  return `${d.getFullYear()}-${String(qMonth + 1).padStart(2, "0")}-01`;
}

function getYearStart(): string {
  return `${new Date().getFullYear()}-01-01`;
}

const todayStr = new Date().toISOString().split("T")[0];
const yearEnd = `${new Date().getFullYear()}-12-31`;

type Period = "month" | "lastMonth" | "quarter" | "year" | "custom";

function formatPeriodLabel(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
  return `${s.toLocaleDateString("en-US", opts)} - ${e.toLocaleDateString("en-US", opts)}`;
}

function exportCSV(data: ProfitLossData, periodLabel: string) {
  const lines = [
    "Profit & Loss Statement",
    periodLabel,
    "",
    "REVENUE",
    `Sales Revenue (${data.revenue.salesCount} sales),${data.revenue.total}`,
  ];

  for (const p of data.revenue.byProduct) {
    lines.push(`  ${p.name},${p.amount}`);
  }
  lines.push(`Total Revenue,${data.revenue.total}`);
  lines.push("");
  lines.push("EXPENSES");

  const cats = ["feed", "medicine", "labor", "utilities", "equipment", "misc"];
  const catLabels: Record<string, string> = { feed: "Feed Costs", medicine: "Medicine/Vaccines", labor: "Labor/Salaries", utilities: "Utilities", equipment: "Equipment/Maintenance", misc: "Miscellaneous" };
  for (const c of cats) {
    lines.push(`${catLabels[c]},${data.expenses.byCategory[c] ?? 0}`);
  }
  lines.push(`Total Expenses,${data.expenses.total}`);
  lines.push("");
  lines.push(`Net Profit/Loss,${data.profit}`);
  lines.push(`Profit Margin,${data.margin.toFixed(1)}%`);
  lines.push("");
  lines.push("COLLECTIONS");
  lines.push(`Total Billed,${data.revenue.total}`);
  lines.push(`Total Collected,${data.revenue.totalCollected}`);
  lines.push(`Outstanding,${data.revenue.outstanding}`);
  lines.push(`Collection Rate,${data.revenue.collectionRate.toFixed(1)}%`);

  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PL_Report_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProfitLossReport(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = user?.farmId ?? null;

  const [period, setPeriod] = useState<Period>("month");
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getMonthEnd());

  function applyPeriod(p: Period) {
    setPeriod(p);
    switch (p) {
      case "month":
        setStartDate(getMonthStart());
        setEndDate(getMonthEnd());
        break;
      case "lastMonth":
        setStartDate(getLastMonthStart());
        setEndDate(getLastMonthEnd());
        break;
      case "quarter":
        setStartDate(getQuarterStart());
        setEndDate(todayStr);
        break;
      case "year":
        setStartDate(getYearStart());
        setEndDate(yearEnd);
        break;
    }
  }

  const { profitLoss, isLoading, error } = useFinancialData(farmId, startDate, endDate, "month");
  const periodLabel = formatPeriodLabel(startDate, endDate);

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          P&L Report is only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 print:p-0 print:max-w-none">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <button
          onClick={() => navigate("/farm/finances")}
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Financial Dashboard
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            onClick={() => profitLoss && exportCSV(profitLoss, periodLabel)}
            disabled={!profitLoss}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5">
            {(["month", "lastMonth", "quarter", "year"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => applyPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${period === p ? "bg-green-100 text-green-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {p === "month" ? "This Month" : p === "lastMonth" ? "Last Month" : p === "quarter" ? "This Quarter" : "This Year"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPeriod("custom"); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPeriod("custom"); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          Failed to load report data: {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Generating report...</p>
        </div>
      ) : profitLoss ? (
        <PLStatement data={profitLoss} periodLabel={periodLabel} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg">No financial data available</p>
          <p className="text-gray-400 text-sm mt-1">Record daily entries and expenses to generate reports.</p>
        </div>
      )}
    </div>
  );
}
