import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { formatDateForDisplay, getTodayString, addDays } from "@/lib/utils";
import { ArrowLeft, Download, Filter, Egg, Skull, Wheat, Bird } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";

interface Flock {
  id: number;
  batchName: string;
  status?: string | null;
}

interface EntryData {
  id: number;
  flockId: number;
  entryDate: string;
  deaths: number;
  deathCause?: string | null;
  eggsGradeA: number;
  eggsGradeB: number;
  eggsCracked: number;
  feedConsumedKg: number;
  waterConsumedLiters?: number | null;
  notes?: string | null;
}

export default function DailyEntryHistoryPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [entries, setEntries] = useState<EntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFlockId, setSelectedFlockId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(addDays(getTodayString(), -30));
  const [endDate, setEndDate] = useState(getTodayString());
  const [showFilters, setShowFilters] = useState(false);

  const flockMap = flocks.reduce<Record<number, string>>((acc, f) => {
    acc[f.id] = f.batchName;
    return acc;
  }, {});

  const loadFlocks = useCallback(async () => {
    if (!isElectron() || !user?.farmId) {
      setIsLoading(false);
      return;
    }
    try {
      const result = await window.electronAPI.flocks.getByFarm(user.farmId);
      if (result.success && result.data) {
        const loaded = result.data as Flock[];
        setFlocks(loaded);
        if (loaded.length === 0) setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, [user?.farmId]);

  const loadEntries = useCallback(async () => {
    if (!isElectron()) return;
    setIsLoading(true);
    try {
      const flocksToQuery = selectedFlockId ? [selectedFlockId] : flocks.map(f => f.id);
      const allEntries: EntryData[] = [];
      for (const fId of flocksToQuery) {
        const result = await window.electronAPI.dailyEntries.getByFlock(fId, startDate, endDate);
        if (result.success && result.data) {
          allEntries.push(...(result.data as EntryData[]));
        }
      }
      allEntries.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
      setEntries(allEntries);
    } catch {} finally {
      setIsLoading(false);
    }
  }, [flocks, selectedFlockId, startDate, endDate]);

  useEffect(() => {
    loadFlocks();
  }, [loadFlocks]);

  useEffect(() => {
    if (flocks.length > 0) loadEntries();
  }, [flocks, loadEntries]);

  const exportCSV = () => {
    const headers = ["Date", "Flock", "Deaths", "Cause", "Grade A", "Grade B", "Cracked", "Total Eggs", "Feed (kg)", "Water (L)", "Notes"];
    const rows = entries.map(e => [
      e.entryDate,
      flockMap[e.flockId] || `Flock ${e.flockId}`,
      e.deaths,
      e.deathCause || "",
      e.eggsGradeA,
      e.eggsGradeB,
      e.eggsCracked,
      (e.eggsGradeA || 0) + (e.eggsGradeB || 0) + (e.eggsCracked || 0),
      e.feedConsumedKg,
      e.waterConsumedLiters || "",
      (e.notes || "").replace(/,/g, ";"),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `daily-entries-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalDeaths = entries.reduce((s, e) => s + (e.deaths || 0), 0);
  const totalEggs = entries.reduce((s, e) => s + (e.eggsGradeA || 0) + (e.eggsGradeB || 0) + (e.eggsCracked || 0), 0);
  const totalFeed = entries.reduce((s, e) => s + (e.feedConsumedKg || 0), 0);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/farm/daily-entry")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Entry History</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <button onClick={exportCSV} disabled={entries.length === 0} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">From</label>
            <input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">To</label>
            <input type="date" value={endDate} min={startDate} max={getTodayString()} onChange={(e) => setEndDate(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Flock</label>
            <select value={selectedFlockId || ""} onChange={(e) => setSelectedFlockId(e.target.value ? Number(e.target.value) : null)} className="w-full h-10 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white">
              <option value="">All flocks</option>
              {flocks.map(f => <option key={f.id} value={f.id}>{f.batchName}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg"><Skull className="w-5 h-5 text-red-600" /></div>
          <div>
            <div className="text-sm text-gray-500">Total Deaths</div>
            <div className="text-xl font-bold text-gray-900">{totalDeaths}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg"><Egg className="w-5 h-5 text-amber-600" /></div>
          <div>
            <div className="text-sm text-gray-500">Total Eggs</div>
            <div className="text-xl font-bold text-gray-900">{totalEggs.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg"><Wheat className="w-5 h-5 text-yellow-600" /></div>
          <div>
            <div className="text-sm text-gray-500">Total Feed</div>
            <div className="text-xl font-bold text-gray-900">{totalFeed.toFixed(1)} kg</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading entries..." />
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={<Bird className="h-8 w-8" />}
            title="No Entries Found"
            description="No daily entries match the selected filters. Try adjusting the date range or flock selection."
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Flock</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Deaths</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Grade A</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Grade B</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Cracked</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700">Feed</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const total = (e.eggsGradeA || 0) + (e.eggsGradeB || 0) + (e.eggsCracked || 0);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => navigate(`/farm/daily-entry?date=${e.entryDate}&flock=${e.flockId}`)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{formatDateForDisplay(e.entryDate)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700">{flockMap[e.flockId] || `Flock ${e.flockId}`}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className={e.deaths > 0 ? "text-red-600 font-medium" : "text-gray-400"}>{e.deaths || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{e.eggsGradeA || 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{e.eggsGradeB || 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{e.eggsCracked || 0}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">{total}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{e.feedConsumedKg || 0} kg</td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[150px]">{e.notes || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
