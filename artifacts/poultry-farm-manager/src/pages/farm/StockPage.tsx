import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Package, RefreshCw, Plus, Egg, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { isElectron, stock as stockApi } from "@/lib/api";
import type { StockMovement, StockSummary } from "@/types/electron";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { useFarmId } from "@/hooks/useFarmId";
import StockAdjustmentModal from "@/components/stock/StockAdjustmentModal";

type MovementFilterType = "" | "collection" | "sale" | "adjustment";

export default function StockPage(): React.ReactElement {
  const farmId = useFarmId();

  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [filter, setFilter] = useState<{ type: MovementFilterType; startDate: string; endDate: string }>({
    type: "",
    startDate: "",
    endDate: "",
  });

  const canUseDesktop = isElectron();

  const loadData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        stockApi.getSummary(farmId),
        stockApi.getMovements(farmId, {
          type: filter.type || undefined,
          startDate: filter.startDate || undefined,
          endDate: filter.endDate || undefined,
          limit: 100,
        }),
      ]);
      setSummary(s);
      setMovements(m);
    } catch {
      setSummary(null);
      setMovements([]);
    } finally {
      setLoading(false);
    }
  }, [farmId, filter.endDate, filter.startDate, filter.type]);

  useEffect(() => {
    if (!farmId) return;
    loadData();
  }, [farmId, loadData]);

  const lowStock = useMemo(() => {
    if (!summary) return false;
    return summary.daysRemaining !== null && summary.daysRemaining < 3;
  }, [summary]);

  if (!canUseDesktop) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Package}
          title="Stock is only available in the desktop app"
          description="Egg stock calculation uses the local database and is available in the Electron desktop app."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Egg Stock
          </h1>
          <p className="text-gray-500">Real-time egg inventory from entries, sales, and adjustments</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Add Adjustment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Current Stock</span>
            <Egg className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(summary?.currentStock ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            = {(summary?.stockInTrays ?? 0).toLocaleString()} trays / {(summary?.stockInPetis ?? 0).toLocaleString()} petis
          </p>
          {summary?.daysRemaining !== null && (
            <p className={`text-sm mt-2 ${summary.daysRemaining < 3 ? "text-red-500" : "text-green-600"}`}>
              ~{summary.daysRemaining} days of stock remaining
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Today's Collection</span>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            +{(summary?.todayCollection ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Avg: {(summary?.avgDailyCollection ?? 0).toLocaleString()}/day
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Today's Sales</span>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            -{(summary?.todaySold ?? 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Avg: {(summary?.avgDailySales ?? 0).toLocaleString()}/day
          </p>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">All Time</span>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="text-gray-500">Collected:</span>{" "}
              <span className="font-semibold text-green-600">{(summary?.totalCollected ?? 0).toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Sold:</span>{" "}
              <span className="font-semibold text-red-600">{(summary?.totalSold ?? 0).toLocaleString()}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Adjustments:</span>{" "}
              <span className={`font-semibold ${(summary?.totalAdjustments ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(summary?.totalAdjustments ?? 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>

      {lowStock && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium text-red-800">Low Stock Alert</p>
            <p className="text-sm text-red-600">
              You have approximately {summary!.daysRemaining} days of stock remaining based on average sales.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter((p) => ({ ...p, type: e.target.value as MovementFilterType }))}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">All Movements</option>
              <option value="collection">Collections</option>
              <option value="sale">Sales</option>
              <option value="adjustment">Adjustments</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter((p) => ({ ...p, startDate: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter((p) => ({ ...p, endDate: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <button onClick={loadData} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            Apply
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Stock Movements</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left py-3 px-4 font-medium">Date</th>
              <th className="text-left py-3 px-4 font-medium">Type</th>
              <th className="text-left py-3 px-4 font-medium">Description</th>
              <th className="text-right py-3 px-4 font-medium">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{m.date}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      m.type === "collection"
                        ? "bg-green-100 text-green-700"
                        : m.type === "sale"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {m.type}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-600">{m.description}</td>
                <td className={`py-3 px-4 text-right font-medium ${m.direction === "in" ? "text-green-600" : "text-red-600"}`}>
                  {m.direction === "in" ? "+" : "-"}
                  {m.quantity.toLocaleString()}
                </td>
              </tr>
            ))}
            {movements.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No stock movements found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdjustmentModal && farmId && (
        <StockAdjustmentModal
          farmId={farmId}
          onClose={() => setShowAdjustmentModal(false)}
          onSubmit={async (data) => {
            await stockApi.createAdjustment(data);
            await loadData();
          }}
        />
      )}
    </div>
  );
}

