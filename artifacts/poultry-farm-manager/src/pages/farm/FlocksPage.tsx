import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isElectron } from "@/lib/api";
import FlockCard from "@/components/flocks/FlockCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { Plus, Bird, Search, ArrowUpDown } from "lucide-react";
import { useFarmId, useOwnerFarmReadOnly } from "@/hooks/useFarmId";
import { useFarmPath } from "@/hooks/useFarmPath";

interface Flock {
  id: number;
  batchName: string;
  breed?: string | null;
  initialCount: number;
  currentCount: number;
  arrivalDate: string;
  ageDays: number;
  status?: string | null;
  mortalityRate: number;
  productionRate: number;
  totalDeaths: number;
  totalEggs: number;
  eggsLast7Days: number;
}

type SortKey = "arrivalDate" | "currentCount" | "ageDays";

export default function FlocksPage(): React.ReactElement {
  const farmId = useFarmId();
  const farmPath = useFarmPath();
  const readOnly = useOwnerFarmReadOnly();
  const navigate = useNavigate();
  const [flocks, setFlocks] = useState<Flock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("arrivalDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const loadFlocks = async () => {
      if (!isElectron() || !farmId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await window.electronAPI.flocks.getByFarm(farmId);
        if (result.success && result.data) {
          setFlocks(result.data as Flock[]);
        } else {
          setError(result.error || "Failed to load flocks");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load flocks");
      } finally {
        setIsLoading(false);
      }
    };
    loadFlocks();
  }, [farmId]);

  const filtered = flocks
    .filter((f) => {
      const isActive = f.status === "active" || !f.status;
      if (tab === "active") return isActive;
      return !isActive;
    })
    .filter((f) =>
      search
        ? f.batchName.toLowerCase().includes(search.toLowerCase())
        : true
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "arrivalDate") cmp = a.arrivalDate.localeCompare(b.arrivalDate);
      else if (sortBy === "currentCount") cmp = a.currentCount - b.currentCount;
      else if (sortBy === "ageDays") cmp = a.ageDays - b.ageDays;
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Loading flocks..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Flocks</h2>
          <p className="text-gray-500 mt-1">
            Manage your bird batches and flock records.
          </p>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={() => navigate(farmPath("flocks/new"))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Flock
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "active"
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Active ({flocks.filter((f) => f.status === "active" || !f.status).length})
          </button>
          <button
            onClick={() => setTab("archived")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "archived"
                ? "bg-emerald-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Archived ({flocks.filter((f) => f.status && f.status !== "active").length})
          </button>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by batch name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["arrivalDate", "currentCount", "ageDays"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                sortBy === key
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {key === "arrivalDate" ? "Date" : key === "currentCount" ? "Count" : "Age"}
              {sortBy === key && <ArrowUpDown className="h-3 w-3" />}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={<Bird className="h-8 w-8" />}
            title={tab === "active" ? "No active flocks" : "No archived flocks"}
            description={
              tab === "active"
                ? readOnly
                  ? "No active flocks in this farm."
                  : "No flocks in this farm. Add a flock to start tracking."
                : "Archived flocks (culled or sold) will appear here."
            }
            actionLabel={tab === "active" && !readOnly ? "Add First Flock" : undefined}
            onAction={tab === "active" && !readOnly ? () => navigate(farmPath("flocks/new")) : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((flock) => (
            <FlockCard key={flock.id} flock={flock} />
          ))}
        </div>
      )}
    </div>
  );
}
