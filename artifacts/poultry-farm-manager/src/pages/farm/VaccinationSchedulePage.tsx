import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { isElectron, vaccinations as vaccApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useVaccinations } from "@/hooks/useVaccinations";
import { useToast } from "@/components/ui/Toast";
import { Syringe, RefreshCw, Settings, Filter, Plus, Pencil, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import VaccinationList from "@/components/vaccinations/VaccinationList";
import CompleteVaccinationModal from "@/components/vaccinations/CompleteVaccinationModal";
import SkipVaccinationModal from "@/components/vaccinations/SkipVaccinationModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { UpcomingVaccination, CompletedVaccination } from "@/types/electron";

type TabType = "upcoming" | "completed" | "all";

const routeLabels: Record<string, string> = {
  eye_drop: "Eye Drop",
  drinking_water: "Drinking Water",
  injection: "Injection",
  spray: "Spray",
  wing_web: "Wing Web",
  oral: "Oral",
};

export default function VaccinationSchedulePage(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const farmId = user?.farmId ?? null;
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
  const [allVaccinations, setAllVaccinations] = useState<CompletedVaccination[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const flockOptions = useMemo(() => {
    const map = new Map<number, string>();
    const source = tab === "all" ? allVaccinations : upcoming;
    for (const v of source) {
      if (v.flockId) map.set(v.flockId, v.flockName);
    }
    for (const v of completed) {
      if (v.flockId) map.set(v.flockId, v.flockName);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [upcoming, completed, allVaccinations, tab]);

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
    if (tab === "all") await loadAll();
    setRefreshing(false);
  }

  async function loadAll(flockFilter?: number | null) {
    if (!farmId) return;
    setAllLoading(true);
    try {
      const filters: { flockId?: number; status?: string } = {};
      if (flockFilter) filters.flockId = flockFilter;
      const data = await vaccApi.getAll(farmId, filters);
      setAllVaccinations(data);
    } catch {
      setAllVaccinations([]);
    } finally {
      setAllLoading(false);
    }
  }

  function handleTabChange(t: TabType) {
    setTab(t);
    if (t === "all" && allVaccinations.length === 0) {
      loadAll();
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await vaccApi.delete(deleteTarget);
      setDeleteTarget(null);
      toast.success("Vaccination deleted");
      await refetch();
      if (tab === "all") await loadAll();
    } catch (err: unknown) {
      setDeleteTarget(null);
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  const allFiltered = filterFlockId
    ? allVaccinations.filter(v => v.flockId === filterFlockId)
    : allVaccinations;

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
            onClick={() => navigate("/farm/vaccinations/new")}
            className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Vaccination
          </button>
          <button
            onClick={() => navigate("/farm/vaccinations/history")}
            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History & Reports
          </button>
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
            {(["upcoming", "completed", "all"] as TabType[]).map(t => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
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

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={filterFlockId ?? ""}
              onChange={e => {
                const val = e.target.value ? Number(e.target.value) : null;
                setFilterFlockId(val);
                if (tab === "all") loadAll(val);
              }}
              className="text-xs rounded-lg border border-gray-200 px-2 py-1 text-gray-600"
            >
              <option value="">All Flocks</option>
              {flockOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
            {tab === "upcoming" && (
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as "urgency" | "flock")}
                className="text-xs rounded-lg border border-gray-200 px-2 py-1 text-gray-600"
              >
                <option value="urgency">Group by Urgency</option>
                <option value="flock">Group by Flock</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner text="Loading vaccinations..." />
      ) : tab === "upcoming" && upcoming.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={<Syringe className="h-8 w-8" />}
            title="No vaccinations scheduled"
            description="Add a vaccination manually or set up a template."
            actionLabel="Add Vaccination"
            onAction={() => navigate("/farm/vaccinations/new")}
          />
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
      ) : tab === "completed" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <CompletedTable
            vaccinations={completed}
            filterFlockId={filterFlockId}
            onEdit={id => navigate(`/farm/vaccinations/${id}/edit`)}
            onDelete={id => setDeleteTarget(id)}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {allLoading ? (
            <LoadingSpinner text="Loading all vaccinations..." />
          ) : (
            <AllTable
              vaccinations={allFiltered}
              onEdit={id => navigate(`/farm/vaccinations/${id}/edit`)}
              onDelete={id => setDeleteTarget(id)}
            />
          )}
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
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Vaccination"
        message="Are you sure you want to delete this vaccination record? This cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function CompletedTable({
  vaccinations,
  filterFlockId,
  onEdit,
  onDelete,
}: {
  vaccinations: CompletedVaccination[];
  filterFlockId: number | null;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}): React.ReactElement {
  const [search, setSearch] = useState("");

  let filtered = vaccinations;
  if (filterFlockId) {
    filtered = filtered.filter(v => v.flockId === filterFlockId);
  }
  if (search) {
    filtered = filtered.filter(v =>
      v.vaccineName.toLowerCase().includes(search.toLowerCase()) ||
      v.flockName.toLowerCase().includes(search.toLowerCase())
    );
  }

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
              <th className="pb-3 font-medium text-gray-500">Route</th>
              <th className="pb-3 font-medium text-gray-500">Dosage</th>
              <th className="pb-3 font-medium text-gray-500">Administered</th>
              <th className="pb-3 font-medium text-gray-500 text-right">Actions</th>
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
                <td className="py-3 text-gray-500">{v.route ? (routeLabels[v.route] || v.route) : "—"}</td>
                <td className="py-3 text-gray-500">{v.dosage || "—"}</td>
                <td className="py-3 text-gray-500">{v.administeredDate ? new Date(v.administeredDate).toLocaleDateString() : "—"}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(v.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(v.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllTable({
  vaccinations,
  onEdit,
  onDelete,
}: {
  vaccinations: CompletedVaccination[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}): React.ReactElement {
  const [search, setSearch] = useState("");

  const filtered = vaccinations.filter(v =>
    !search ||
    v.vaccineName.toLowerCase().includes(search.toLowerCase()) ||
    v.flockName.toLowerCase().includes(search.toLowerCase())
  );

  if (vaccinations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No vaccinations found</p>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

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
              <th className="pb-3 font-medium text-gray-500">Route</th>
              <th className="pb-3 font-medium text-gray-500">Dosage</th>
              <th className="pb-3 font-medium text-gray-500">Date</th>
              <th className="pb-3 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(v => {
              const isOverdue = v.status === "pending" && v.scheduledDate < today;
              const statusLabel = v.status === "completed"
                ? "Completed"
                : v.status === "skipped"
                ? "Skipped"
                : isOverdue
                ? "Overdue"
                : "Upcoming";
              const statusClass = v.status === "completed"
                ? "bg-green-100 text-green-700"
                : v.status === "skipped"
                ? "bg-gray-100 text-gray-600"
                : isOverdue
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700";

              return (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-gray-900">{v.vaccineName}</td>
                  <td className="py-3 text-gray-600">{v.flockName}</td>
                  <td className="py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{v.route ? (routeLabels[v.route] || v.route) : "—"}</td>
                  <td className="py-3 text-gray-500">{v.dosage || "—"}</td>
                  <td className="py-3 text-gray-500">
                    {new Date(v.administeredDate || v.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(v.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(v.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
