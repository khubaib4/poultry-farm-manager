import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { useFinancialData } from "@/hooks/useFinancialData";
import { DollarSign, Receipt, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ProfitLossCard from "@/components/financial/ProfitLossCard";
import FinancialTrendChart from "@/components/financial/FinancialTrendChart";
import ExpensePieChart from "@/components/financial/ExpensePieChart";
import RevenuePieChart from "@/components/financial/RevenuePieChart";
import QuickStatsGrid from "@/components/financial/QuickStatsGrid";

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

export default function FinancialDashboard(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = user?.farmId ?? null;

  const [period, setPeriod] = useState<Period>("month");
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getMonthEnd());
  const [groupBy, setGroupBy] = useState("day");

  function applyPeriod(p: Period) {
    setPeriod(p);
    switch (p) {
      case "month":
        setStartDate(getMonthStart());
        setEndDate(getMonthEnd());
        setGroupBy("day");
        break;
      case "lastMonth":
        setStartDate(getLastMonthStart());
        setEndDate(getLastMonthEnd());
        setGroupBy("day");
        break;
      case "quarter":
        setStartDate(getQuarterStart());
        setEndDate(todayStr);
        setGroupBy("week");
        break;
      case "year":
        setStartDate(getYearStart());
        setEndDate(yearEnd);
        setGroupBy("month");
        break;
    }
  }

  const { profitLoss, trends, perBird, perEgg, isLoading, error } = useFinancialData(farmId, startDate, endDate, groupBy);

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Financial dashboard is only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Track profitability and financial health</p>
        </div>
        <button
          onClick={() => navigate("/farm/finances/report")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <FileText className="h-4 w-4" />
          P&L Report
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
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
          Failed to load financial data: {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading financial data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-green-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total Revenue</span>
                <div className="h-9 w-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(profitLoss?.revenue.total ?? 0)}</p>
            </div>

            <div className="bg-white rounded-xl border border-red-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total Expenses</span>
                <div className="h-9 w-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(profitLoss?.expenses.total ?? 0)}</p>
            </div>

            <ProfitLossCard profit={profitLoss?.profit ?? 0} margin={profitLoss?.margin ?? 0} />

            <div className="bg-white rounded-xl border border-blue-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Profit Margin</span>
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="text-sm font-bold">%</span>
                </div>
              </div>
              <p className={`text-xl font-bold ${(profitLoss?.margin ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(profitLoss?.margin ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>

          <FinancialTrendChart data={trends} groupBy={groupBy} onGroupByChange={setGroupBy} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExpensePieChart
              byCategory={profitLoss?.expenses.byCategory ?? {}}
              total={profitLoss?.expenses.total ?? 0}
            />
            <RevenuePieChart
              byGrade={profitLoss?.revenue.byGrade ?? { A: 0, B: 0, cracked: 0 }}
              total={profitLoss?.revenue.total ?? 0}
            />
          </div>

          <QuickStatsGrid perBird={perBird} perEgg={perEgg} />
        </>
      )}
    </div>
  );
}
