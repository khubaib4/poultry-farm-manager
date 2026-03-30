import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isElectron } from "@/lib/api";
import { useVaccinations } from "@/hooks/useVaccinations";
import { Syringe, RefreshCw, Settings, Filter } from "lucide-react";
import VaccinationList from "@/components/vaccinations/VaccinationList";
import CompleteVaccinationModal from "@/components/vaccinations/CompleteVaccinationModal";
import SkipVaccinationModal from "@/components/vaccinations/SkipVaccinationModal";
import type { UpcomingVaccination, CompletedVaccination } from "@/types/electron";

type TabType = "upcoming" | "completed";

export default function VaccinationSchedulePage(): React.ReactElement {
  const navigate = useNavigate();
  const {
    upcoming,
    completed,
    isLoading,
    completeVaccination,
    skipVaccination,
    refetch,
  } = useVaccinations();

  const [tab, setTab] = useState<TabType>("upcoming");
  const [filterFlockId, setFilterFlockId] = useState<number | null>(null);
  const [groupBy, setGroupBy] = useState<"urgency" | "flock">("urgency");
  const [refreshing, setRefreshing] = useState(false);
  const [completeModal, setCompleteModal] = useState<UpcomingVaccination | null>(null);
  const [skipModal, setSkipModal] = useState<UpcomingVaccination | null>(null);

  const flockOptions = useMemo(() => {
    const map = new Map<number, string>();
    for (const v of upcoming) {
      if (v.flockId) map.set(v.flockId, v.flockName);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [upcoming]);

  const overdueCount = upcoming.filter(v => v.daysUntilDue < 0).length;

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Vaccinations are only available in the desktop app.
        </div>
      </div>
    );
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Syringe className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vaccination Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {upcoming.length} upcoming{overdueCount > 0 ? ` (${overdueCount} overdue)` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/farm/vaccinations/template")}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Schedule Template
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {(["upcoming", "completed"] as TabType[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
                  tab === t ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t}
                {t === "upcoming" && upcoming.length > 0 && (
                  <span className="ml-1 text-xs bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">{upcoming.length}</span>
                )}
              </button>
            ))}
          </div>

          {tab === "upcoming" && (
            <>
              <div className="h-5 w-px bg-gray-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={filterFlockId ?? ""}
                  onChange={e => setFilterFlockId(e.target.value ? Number(e.target.value) : null)}
                  className="text-xs rounded-lg border border-gray-200 px-2 py-1 text-gray-600"
                >
                  <option value="">All Flocks</option>
                  {flockOptions.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <select
                  value={groupBy}
                  onChange={e => setGroupBy(e.target.value as "urgency" | "flock")}
                  className="text-xs rounded-lg border border-gray-200 px-2 py-1 text-gray-600"
                >
                  <option value="urgency">Group by Urgency</option>
                  <option value="flock">Group by Flock</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading vaccinations...</p>
        </div>
      ) : tab === "upcoming" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <VaccinationList
            vaccinations={upcoming}
            onComplete={v => setCompleteModal(v)}
            onSkip={v => setSkipModal(v)}
            groupBy={groupBy}
            filterFlockId={filterFlockId}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <CompletedTable vaccinations={completed} />
        </div>
      )}

      {completeModal && (
        <CompleteVaccinationModal
          vaccination={completeModal}
          onConfirm={completeVaccination}
          onClose={() => setCompleteModal(null)}
        />
      )}
      {skipModal && (
        <SkipVaccinationModal
          vaccination={skipModal}
          onConfirm={skipVaccination}
          onClose={() => setSkipModal(null)}
        />
      )}
    </div>
  );
}

function CompletedTable({ vaccinations }: { vaccinations: CompletedVaccination[] }): React.ReactElement {
  const [search, setSearch] = useState("");

  const filtered = vaccinations.filter(v =>
    !search ||
    v.vaccineName.toLowerCase().includes(search.toLowerCase()) ||
    v.flockName.toLowerCase().includes(search.toLowerCase())
  );

  if (vaccinations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No completed vaccinations yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by vaccine or flock..."
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-3 font-medium text-gray-500">Vaccine</th>
              <th className="pb-3 font-medium text-gray-500">Flock</th>
              <th className="pb-3 font-medium text-gray-500">Status</th>
              <th className="pb-3 font-medium text-gray-500">Scheduled</th>
              <th className="pb-3 font-medium text-gray-500">Administered</th>
              <th className="pb-3 font-medium text-gray-500">By</th>
              <th className="pb-3 font-medium text-gray-500">Batch #</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(v => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="py-3 font-medium text-gray-900">{v.vaccineName}</td>
                <td className="py-3 text-gray-600">{v.flockName}</td>
                <td className="py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    v.status === "completed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {v.status === "completed" ? "Completed" : "Skipped"}
                  </span>
                </td>
                <td className="py-3 text-gray-500">{new Date(v.scheduledDate).toLocaleDateString()}</td>
                <td className="py-3 text-gray-500">{v.administeredDate ? new Date(v.administeredDate).toLocaleDateString() : "—"}</td>
                <td className="py-3 text-gray-500">{v.administeredBy || "—"}</td>
                <td className="py-3 text-gray-500">{v.batchNumber || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
