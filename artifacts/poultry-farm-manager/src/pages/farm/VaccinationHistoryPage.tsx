import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { flocks as flocksApi } from "@/lib/api";
import { useVaccinationHistory } from "@/hooks/useVaccinationHistory";
import VaccinationHistoryTable from "@/components/vaccinations/VaccinationHistoryTable";
import VaccinationComplianceCard from "@/components/vaccinations/VaccinationComplianceCard";
import ExportVaccinationModal from "@/components/vaccinations/ExportVaccinationModal";
import type { VaccinationHistoryItem } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";

export default function VaccinationHistoryPage() {
  const { user } = useAuth();
  const farmId = useFarmId();
  const { items, total, page, totalPages, stats, isLoading, filters, setFilters, refetch } = useVaccinationHistory(farmId);

  const [flocksList, setFlocksList] = useState<{ id: number; batchName: string }[]>([]);
  const [showExport, setShowExport] = useState(false);
  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (!farmId) return;
    flocksApi.getByFarm(farmId).then((data: unknown) => {
      if (Array.isArray(data)) {
        setFlocksList(data.map((f: { id: number; batchName: string }) => ({ id: f.id, batchName: f.batchName })));
      }
    }).catch(() => {});
  }, [farmId]);

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    sorted.sort((a, b) => {
      let aVal = "";
      let bVal = "";
      switch (sortColumn) {
        case "date": aVal = a.administeredDate || a.scheduledDate; bVal = b.administeredDate || b.scheduledDate; break;
        case "flock": aVal = a.flockName; bVal = b.flockName; break;
        case "vaccine": aVal = a.vaccineName; bVal = b.vaccineName; break;
        case "status": aVal = a.status || ""; bVal = b.status || ""; break;
        case "administeredBy": aVal = a.administeredBy || ""; bVal = b.administeredBy || ""; break;
        case "batchNumber": aVal = a.batchNumber || ""; bVal = b.batchNumber || ""; break;
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted as VaccinationHistoryItem[];
  }, [items, sortColumn, sortDirection]);

  function handleSort(column: string) {
    if (column === sortColumn) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  if (!isElectron()) {
    return (
      <div className="p-6 text-center text-gray-500">
        This feature is only available in the desktop app.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vaccination History</h1>
          <p className="text-sm text-gray-500 mt-1">Complete vaccination records across all flocks</p>
        </div>
        <button
          onClick={() => setShowExport(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <VaccinationComplianceCard stats={stats} />
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-center items-center">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500 mt-1">Total Vaccinations</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-center items-center">
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500 mt-1">Completed</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col justify-center items-center">
            <div className="text-3xl font-bold text-gray-600">
              {stats.lastCompletedDate || "—"}
            </div>
            <div className="text-sm text-gray-500 mt-1">Last Vaccination</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Flock</label>
            <select
              value={filters.flockId || ""}
              onChange={e => setFilters({ flockId: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Flocks</option>
              {flocksList.map(f => (
                <option key={f.id} value={f.id}>{f.batchName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={e => setFilters({ startDate: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={e => setFilters({ endDate: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filters.status || "all"}
              onChange={e => setFilters({ status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={filters.search || ""}
              onChange={e => setFilters({ search: e.target.value || undefined })}
              placeholder="Vaccine or flock name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        {(filters.flockId || filters.startDate || filters.endDate || (filters.status && filters.status !== "all") || filters.search) && (
          <button
            onClick={() => setFilters({ flockId: undefined, startDate: undefined, endDate: undefined, status: "all", search: undefined })}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            Clear all filters
          </button>
        )}
      </div>

      <VaccinationHistoryTable
        items={sortedItems}
        isLoading={isLoading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={p => setFilters({ page: p })}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      {showExport && farmId && (
        <ExportVaccinationModal
          farmId={farmId}
          farmName={user?.name || "Farm"}
          onClose={() => { setShowExport(false); refetch(); }}
        />
      )}
    </div>
  );
}
