import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { eggPrices as eggPricesApi } from "@/lib/api";
import { ArrowLeft, RefreshCw } from "lucide-react";
import CurrentPricesCard from "@/components/pricing/CurrentPricesCard";
import UpdatePricesModal from "@/components/pricing/UpdatePricesModal";
import PriceHistoryTable from "@/components/pricing/PriceHistoryTable";
import RevenueCalculator from "@/components/pricing/RevenueCalculator";

interface EggPriceRecord {
  id: number;
  grade: string;
  pricePerEgg: number;
  pricePerTray: number;
  effectiveDate: string;
}

interface HistoryGroup {
  effectiveDate: string;
  prices: EggPriceRecord[];
}

type PricesMap = Record<string, EggPriceRecord | null>;

export default function EggPricingPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = user?.farmId ?? null;

  const [prices, setPrices] = useState<PricesMap>({ A: null, B: null, cracked: null });
  const [history, setHistory] = useState<HistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const [current, hist] = await Promise.all([
        eggPricesApi.getCurrentPrices(farmId),
        eggPricesApi.getHistory(farmId),
      ]);
      setPrices(current as PricesMap);
      setHistory(hist as HistoryGroup[]);
    } catch {
      setPrices({ A: null, B: null, cracked: null });
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave(pricesList: { grade: string; pricePerEgg: number; pricePerTray: number }[], effectiveDate: string) {
    if (!farmId) return;
    await eggPricesApi.createBatch(farmId, pricesList, effectiveDate);
    await fetchData();
  }

  if (!isElectron()) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">This feature requires the desktop application.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/farm/dashboard")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Egg Pricing</h1>
            <p className="text-sm text-gray-500">Manage egg prices by grade</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Update Prices
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <CurrentPricesCard prices={prices} onUpdate={() => setModalOpen(true)} />
          <RevenueCalculator prices={prices} />
          <PriceHistoryTable history={history} />
        </>
      )}

      <UpdatePricesModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        currentPrices={prices}
      />
    </div>
  );
}
