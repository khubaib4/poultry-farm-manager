import { useState, useCallback } from "react";
import { reports } from "@/lib/api";
import type { ReportConfig, ReportType } from "@/components/reports/ReportConfigPanel";
import type {
  DailyReportData,
  WeeklyReportData,
  MonthlyReportData,
  FlockReportData,
  FinancialReportData,
} from "@/types/electron";

type ReportData = DailyReportData | WeeklyReportData | MonthlyReportData | FlockReportData | FinancialReportData;

interface UseReportDataReturn {
  data: ReportData | null;
  reportType: ReportType | null;
  isLoading: boolean;
  error: string | null;
  generate: (farmId: number, config: ReportConfig) => Promise<void>;
  clear: () => void;
}

export function useReportData(): UseReportDataReturn {
  const [data, setData] = useState<ReportData | null>(null);
  const [reportType, setReportType] = useState<ReportType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (farmId: number, config: ReportConfig) => {
    setIsLoading(true);
    setError(null);
    setData(null);
    setReportType(config.reportType);

    try {
      let result: ReportData;
      switch (config.reportType) {
        case "daily":
          result = await reports.getDailySummary(farmId, config.date!);
          break;
        case "weekly":
          result = await reports.getWeeklySummary(farmId, config.startDate!, config.endDate!);
          break;
        case "monthly":
          result = await reports.getMonthlySummary(farmId, config.month!, config.year!);
          break;
        case "flock":
          result = await reports.getFlockReport(config.flockId!);
          break;
        case "financial":
          result = await reports.getFinancialReport(farmId, config.startDate!, config.endDate!);
          break;
        default:
          throw new Error("Unknown report type");
      }
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report");
    }
    setIsLoading(false);
  }, []);

  const clear = useCallback(() => {
    setData(null);
    setReportType(null);
    setError(null);
  }, []);

  return { data, reportType, isLoading, error, generate, clear };
}
