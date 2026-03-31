import { useState, useCallback } from "react";
import { salesReports as api } from "@/lib/api";
import type {
  SalesSummaryReport,
  CustomerHistoryReport,
  TopCustomer,
  SalesTrendPoint,
  GradeBreakdownReport,
} from "@/types/electron";

interface SalesReportState {
  summary: SalesSummaryReport | null;
  customerHistory: CustomerHistoryReport | null;
  topCustomers: TopCustomer[];
  trendData: SalesTrendPoint[];
  gradeBreakdown: GradeBreakdownReport[];
  isLoading: boolean;
  error: string | null;
}

export function useSalesReports() {
  const [state, setState] = useState<SalesReportState>({
    summary: null,
    customerHistory: null,
    topCustomers: [],
    trendData: [],
    gradeBreakdown: [],
    isLoading: false,
    error: null,
  });

  const generateSummary = useCallback(
    async (farmId: number, startDate: string, endDate: string, period: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const [summary, trendData, gradeBreakdown] = await Promise.all([
          api.getSummary(farmId, startDate, endDate),
          api.getSalesTrend(farmId, period, startDate, endDate),
          api.getGradeBreakdown(farmId, startDate, endDate),
        ]);
        setState(prev => ({
          ...prev,
          summary,
          trendData,
          gradeBreakdown,
          customerHistory: null,
          topCustomers: [],
          isLoading: false,
        }));
      } catch (err: any) {
        setState(prev => ({ ...prev, isLoading: false, error: err.message || "Failed to generate report" }));
      }
    },
    []
  );

  const generateCustomerHistory = useCallback(
    async (customerId: number, startDate: string, endDate: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const customerHistory = await api.getCustomerHistory(customerId, startDate, endDate);
        setState(prev => ({
          ...prev,
          customerHistory,
          summary: null,
          topCustomers: [],
          trendData: [],
          gradeBreakdown: [],
          isLoading: false,
        }));
      } catch (err: any) {
        setState(prev => ({ ...prev, isLoading: false, error: err.message || "Failed to generate report" }));
      }
    },
    []
  );

  const generateTopCustomers = useCallback(
    async (farmId: number, limit: number, startDate: string, endDate: string) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const topCustomers = await api.getTopCustomers(farmId, limit, startDate, endDate);
        setState(prev => ({
          ...prev,
          topCustomers,
          summary: null,
          customerHistory: null,
          trendData: [],
          gradeBreakdown: [],
          isLoading: false,
        }));
      } catch (err: any) {
        setState(prev => ({ ...prev, isLoading: false, error: err.message || "Failed to generate report" }));
      }
    },
    []
  );

  return {
    ...state,
    generateSummary,
    generateCustomerHistory,
    generateTopCustomers,
  };
}
