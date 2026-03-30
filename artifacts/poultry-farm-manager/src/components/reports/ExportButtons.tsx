import { useState } from "react";
import { FileText, FileSpreadsheet, Printer } from "lucide-react";
import {
  exportDailyReportPDF,
  exportWeeklyReportPDF,
  exportMonthlyReportPDF,
  exportFlockReportPDF,
  exportFinancialReportPDF,
} from "@/lib/pdfExport";
import {
  exportDailyReportExcel,
  exportWeeklyReportExcel,
  exportMonthlyReportExcel,
  exportFlockReportExcel,
  exportFinancialReportExcel,
} from "@/lib/excelExport";
import type { ReportType } from "@/components/reports/ReportConfigPanel";
import type {
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  FlockReportData,
  FinancialReportData,
} from "@/types/electron";

type ReportData = DailyReportData | WeeklyReportData | MonthlyReportData | FlockReportData | FinancialReportData;

interface Props {
  reportType: ReportType;
  reportData: ReportData;
  farmName: string;
  onPrint: () => void;
}

export default function ExportButtons({ reportType, reportData, farmName, onPrint }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handlePDF() {
    setPdfLoading(true);
    try {
      switch (reportType) {
        case "daily": exportDailyReportPDF(reportData as DailyReportData, farmName); break;
        case "weekly": exportWeeklyReportPDF(reportData as WeeklyReportData, farmName); break;
        case "monthly": exportMonthlyReportPDF(reportData as MonthlyReportData, farmName); break;
        case "flock": exportFlockReportPDF(reportData as FlockReportData, farmName); break;
        case "financial": exportFinancialReportPDF(reportData as FinancialReportData, farmName); break;
        default: throw new Error(`Unsupported report type: ${reportType}`);
      }
      showToast("PDF downloaded successfully", "success");
    } catch (err) {
      console.error("PDF export failed:", err);
      showToast(err instanceof Error ? err.message : "Failed to export PDF", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  async function handleExcel() {
    setExcelLoading(true);
    try {
      switch (reportType) {
        case "daily": exportDailyReportExcel(reportData as DailyReportData, farmName); break;
        case "weekly": exportWeeklyReportExcel(reportData as WeeklyReportData, farmName); break;
        case "monthly": exportMonthlyReportExcel(reportData as MonthlyReportData, farmName); break;
        case "flock": exportFlockReportExcel(reportData as FlockReportData, farmName); break;
        case "financial": exportFinancialReportExcel(reportData as FinancialReportData, farmName); break;
        default: throw new Error(`Unsupported report type: ${reportType}`);
      }
      showToast("Excel downloaded successfully", "success");
    } catch (err) {
      console.error("Excel export failed:", err);
      showToast(err instanceof Error ? err.message : "Failed to export Excel", "error");
    } finally {
      setExcelLoading(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handlePDF}
          disabled={pdfLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          {pdfLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          Export PDF
        </button>

        <button
          onClick={handleExcel}
          disabled={excelLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          {excelLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FileSpreadsheet className="w-4 h-4" />
          )}
          Export Excel
        </button>

        <button
          onClick={onPrint}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {toast && (
        <div className={`absolute top-full left-0 mt-2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50 ${
          toast.type === "success" ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
