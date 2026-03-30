import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, owner as ownerApi } from "@/lib/api";
import FarmComparisonChart from "@/components/owner/FarmComparisonChart";
import FarmComparisonTable from "@/components/owner/FarmComparisonTable";
import { Loader2, BarChart3, Calendar } from "lucide-react";
import type { FarmComparisonData, FarmOverview } from "@/types/electron";

import * as XLSX from "xlsx";

export default function FarmComparisonPage(): React.ReactElement {
  const { user } = useAuth();
  const [farms, setFarms] = useState<FarmOverview[]>([]);
  const [comparisonData, setComparisonData] = useState<FarmComparisonData[]>([]);
  const [selectedFarmIds, setSelectedFarmIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const defaultStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultEnd = now.toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const loadFarms = useCallback(async () => {
    if (!isElectron() || !user) return;
    try {
      const farmsData = await ownerApi.getFarmsOverview(user.id);
      setFarms(farmsData);
      setSelectedFarmIds(farmsData.map((f) => f.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load farms");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadComparison = useCallback(async () => {
    if (!isElectron() || !user || selectedFarmIds.length === 0) {
      setComparisonData([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await ownerApi.getFarmComparison(user.id, selectedFarmIds, startDate, endDate);
      setComparisonData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comparison");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedFarmIds, startDate, endDate]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  useEffect(() => {
    if (farms.length > 0) loadComparison();
  }, [farms, loadComparison]);

  const toggleFarm = (id: number) => {
    setSelectedFarmIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedFarmIds(farms.map((f) => f.id));
  const deselectAll = () => setSelectedFarmIds([]);

  const handleExport = () => {
    if (comparisonData.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(
      comparisonData.map((d) => ({
        "Farm": d.farmName,
        "Total Birds": d.totalBirds,
        "Avg Eggs/Day": d.avgEggsPerDay,
        "Production Rate (%)": d.productionRate,
        "Mortality Rate (%)": d.mortalityRate,
        "Revenue": d.revenue,
        "Expenses": d.expenses,
        "Profit": d.profit,
        "Profit Margin (%)": d.profitMargin,
      }))
    );
    ws["!cols"] = [
      { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 18 },
      { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Farm Comparison");
    XLSX.writeFile(wb, `Farm_Comparison_${startDate}_to_${endDate}.xlsx`);
  };

  if (!isElectron()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">This feature is only available in the desktop app.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-blue-600" />
          Farm Comparison
        </h2>
        <p className="text-slate-500 mt-1">Compare performance metrics across your farms</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" /> Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadComparison}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Compare
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700">Select Farms</p>
            <div className="flex items-center gap-2">
              <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800">Select All</button>
              <span className="text-slate-300">|</span>
              <button onClick={deselectAll} className="text-xs text-blue-600 hover:text-blue-800">Deselect All</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {farms.map((farm) => (
              <button
                key={farm.id}
                onClick={() => toggleFarm(farm.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                  selectedFarmIds.includes(farm.id)
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {farm.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <FarmComparisonChart data={comparisonData} />
          <FarmComparisonTable data={comparisonData} onExport={handleExport} />
        </>
      )}
    </div>
  );
}
