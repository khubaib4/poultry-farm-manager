import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { useReportData } from "@/hooks/useReportData";
import ReportTypeCard from "@/components/reports/ReportTypeCard";
import ReportConfigPanel from "@/components/reports/ReportConfigPanel";
import type { ReportConfig, ReportType } from "@/components/reports/ReportConfigPanel";
import DailySummaryReport from "@/components/reports/DailySummaryReport";
import WeeklyReport from "@/components/reports/WeeklyReport";
import MonthlyReport from "@/components/reports/MonthlyReport";
import FlockReport from "@/components/reports/FlockReport";
import FinancialReport from "@/components/reports/FinancialReport";
import type { DailyReportData, WeeklyReportData, MonthlyReportData, FlockReportData, FinancialReportData } from "@/types/electron";

const REPORT_TYPES: {
  type: ReportType;
  title: string;
  description: string;
  includes: string[];
  icon: React.ReactNode;
}[] = [
  {
    type: "daily",
    title: "Daily Summary",
    description: "Complete snapshot of a single day's operations",
    includes: ["Flock stats", "Egg production", "Feed", "Revenue"],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    type: "weekly",
    title: "Weekly Performance",
    description: "7-day performance with daily breakdown",
    includes: ["Daily breakdown", "Totals", "Averages", "Financial"],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  },
  {
    type: "monthly",
    title: "Monthly Summary",
    description: "Full month overview with all metrics",
    includes: ["Weekly breakdown", "Production", "Financial", "Inventory", "Vaccination"],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  },
  {
    type: "flock",
    title: "Flock Performance",
    description: "Detailed report for a specific flock",
    includes: ["Lifetime stats", "Production curve", "Mortality", "Vaccinations"],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
  },
  {
    type: "financial",
    title: "Financial Report",
    description: "Revenue, expenses, and profit analysis",
    includes: ["Revenue by grade", "Expenses by category", "P&L", "Per-unit metrics"],
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const farmId = user?.farmId ?? null;
  const [selectedType, setSelectedType] = useState<ReportType>("daily");
  const { data, reportType, isLoading, error, generate, clear } = useReportData();
  const reportRef = useRef<HTMLDivElement>(null);

  function handleGenerate(config: ReportConfig) {
    if (!farmId) return;
    generate(farmId, config);
  }

  function handlePrint() {
    if (!reportRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Report</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@3/dist/tailwind.min.css" rel="stylesheet">
      <style>@media print { body { margin: 0; } .no-print { display: none; } }</style>
      </head><body>${reportRef.current.innerHTML}
      <script>setTimeout(()=>window.print(),500)</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  if (!isElectron()) {
    return (
      <div className="p-6 text-center text-gray-500">
        This feature is only available in the desktop app.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and preview farm performance reports</p>
      </div>

      {!data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {REPORT_TYPES.map(rt => (
              <ReportTypeCard
                key={rt.type}
                icon={rt.icon}
                title={rt.title}
                description={rt.description}
                includes={rt.includes}
                selected={selectedType === rt.type}
                onClick={() => { setSelectedType(rt.type); clear(); }}
              />
            ))}
          </div>

          <div className="max-w-md">
            {farmId && (
              <ReportConfigPanel
                reportType={selectedType}
                farmId={farmId}
                onGenerate={handleGenerate}
                isGenerating={isLoading}
              />
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </>
      )}

      {data && (
        <div>
          <div className="flex items-center gap-3 mb-4 no-print">
            <button
              onClick={clear}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Reports
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print / Export PDF
            </button>
          </div>
          <div ref={reportRef} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            {reportType === "daily" && <DailySummaryReport data={data as DailyReportData} />}
            {reportType === "weekly" && <WeeklyReport data={data as WeeklyReportData} />}
            {reportType === "monthly" && <MonthlyReport data={data as MonthlyReportData} />}
            {reportType === "flock" && <FlockReport data={data as FlockReportData} />}
            {reportType === "financial" && <FinancialReport data={data as FinancialReportData} />}
          </div>
        </div>
      )}
    </div>
  );
}
