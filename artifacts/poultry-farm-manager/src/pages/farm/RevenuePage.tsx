import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, revenue as revenueApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RevenueSummaryCards from "@/components/revenue/RevenueSummaryCards";
import RevenueBreakdownCard from "@/components/revenue/RevenueByGradeCard";
import RevenueChart from "@/components/revenue/RevenueChart";
import DailyRevenueTable from "@/components/revenue/DailyRevenueTable";
import type { DailyRevenueEntry, TotalRevenue, RevenueVsExpenses } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getMonthEnd(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split("T")[0];
}

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
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

const todayStr = new Date().toISOString().split("T")[0];

type DatePreset = "today" | "week" | "month" | "lastMonth" | "custom";

export default function RevenuePage(): React.ReactElement {
  const { user } = useAuth();
  const farmId = useFarmId();

  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getMonthEnd());
  const [preset, setPreset] = useState<DatePreset>("month");
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyRevenueEntry[]>([]);
  const [totals, setTotals] = useState<TotalRevenue | null>(null);
  const [profitData, setProfitData] = useState<RevenueVsExpenses | null>(null);

  function applyPreset(p: DatePreset) {
    setPreset(p);
    switch (p) {
      case "today":
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case "week":
        setStartDate(getWeekStart());
        setEndDate(todayStr);
        break;
      case "month":
        setStartDate(getMonthStart());
        setEndDate(getMonthEnd());
        break;
      case "lastMonth":
        setStartDate(getLastMonthStart());
        setEndDate(getLastMonthEnd());
        break;
    }
  }

  const fetchData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const [daily, total, profit] = await Promise.all([
        revenueApi.getDailySummary(farmId, startDate, endDate),
        revenueApi.getTotalRevenue(farmId, startDate, endDate),
        revenueApi.getRevenueVsExpenses(farmId, startDate, endDate),
      ]);
      setDailyData(daily.daily);
      setTotals(total);
      setProfitData(profit);
    } catch {
      setDailyData([]);
      setTotals(null);
      setProfitData(null);
    } finally {
      setLoading(false);
    }
  }, [farmId, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Revenue tracking is only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Track sales revenue and collections</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-1.5">
            {(["today", "week", "month", "lastMonth"] as DatePreset[]).map(p => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${preset === p ? "bg-green-100 text-green-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "Last Month"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={startDate}
              onChange={e => { setStartDate(e.target.value); setPreset("custom"); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => { setEndDate(e.target.value); setPreset("custom"); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading revenue data..." />
      ) : (
        <>
          <RevenueSummaryCards
            totalRevenue={totals?.totalRevenue ?? 0}
            totalCollected={totals?.totalCollected ?? 0}
            outstanding={totals?.outstanding ?? 0}
            profit={profitData?.profit ?? 0}
          />

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            <RevenueChart data={dailyData} />
          </div>

          <RevenueBreakdownCard
            byCustomer={totals?.byCustomer ?? []}
            byType={totals?.byType ?? []}
            totalRevenue={totals?.totalRevenue ?? 0}
          />

          {profitData && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Profit & Loss Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Revenue</p>
                  <p className="text-lg font-bold text-green-600">{profitData.revenue > 0 ? "+" : ""}{formatCurrency(profitData.revenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Expenses</p>
                  <p className="text-lg font-bold text-red-600">-{formatCurrency(profitData.expenses)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Net Profit</p>
                  <p className={`text-lg font-bold ${profitData.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {profitData.profit >= 0 ? "+" : ""}{formatCurrency(profitData.profit)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DailyRevenueTable data={dailyData} />
        </>
      )}
    </div>
  );
}
