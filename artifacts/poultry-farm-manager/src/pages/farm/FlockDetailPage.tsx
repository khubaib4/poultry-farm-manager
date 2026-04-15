import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isElectron } from "@/lib/api";
import { formatAge } from "@/lib/utils";
import ChangeStatusModal from "@/components/flocks/ChangeStatusModal";
import {
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  AlertTriangle,
  Bird,
  Skull,
  Egg,
  TrendingUp,
  Calendar,
  Clock,
  Syringe,
} from "lucide-react";

interface FlockDetail {
  id: number;
  farmId: number;
  batchName: string;
  breed?: string | null;
  initialCount: number;
  currentCount: number;
  arrivalDate: string;
  ageAtArrivalDays?: number | null;
  status?: string | null;
  statusChangedDate?: string | null;
  statusNotes?: string | null;
  notes?: string | null;
  ageDays: number;
  mortalityRate: number;
  productionRate: number;
  totalDeaths: number;
  totalEggs: number;
  eggsLast7Days: number;
  createdAt?: string | null;
}

interface Vaccination {
  id: number;
  vaccineName: string;
  scheduledDate: string;
  administeredDate?: string | null;
  status?: string | null;
}

export default function FlockDetailPage(): React.ReactElement {
  const { flockId } = useParams<{ flockId: string }>();
  const navigate = useNavigate();
  const [flock, setFlock] = useState<FlockDetail | null>(null);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "vaccinations">("overview");

  const loadFlock = async () => {
    if (!isElectron() || !flockId) {
      setIsLoading(false);
      return;
    }
    try {
      const result = await window.electronAPI.flocks.getById(parseInt(flockId, 10));
      if (result.success && result.data) {
        setFlock(result.data as FlockDetail);
      } else {
        setError(result.error || "Flock not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load flock");
    } finally {
      setIsLoading(false);
    }
  };

  const loadVaccinations = async () => {
    if (!isElectron() || !flockId) return;
    try {
      const result = await window.electronAPI.vaccinations.getByFlock(parseInt(flockId, 10));
      if (result.success && result.data) {
        setVaccinations(result.data as Vaccination[]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadFlock();
    loadVaccinations();
  }, [flockId]);

  const handleChangeStatus = async (status: string, date: string, notes: string) => {
    if (!isElectron() || !flockId) return;
    setStatusLoading(true);
    try {
      const result = await window.electronAPI.flocks.changeStatus(
        parseInt(flockId, 10),
        status,
        date,
        notes || undefined
      );
      if (result.success) {
        setShowStatusModal(false);
        await loadFlock();
      } else {
        setError(result.error || "Failed to update status");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isElectron() || !flockId) return;
    if (!confirm("Are you sure you want to delete this flock? This cannot be undone.")) return;
    try {
      const result = await window.electronAPI.flocks.delete(parseInt(flockId, 10));
      if (result.success) {
        navigate("/farm/flocks", { replace: true });
      } else {
        setError(result.error || "Failed to delete flock");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete flock");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!flock) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{error || "Flock not found"}</p>
        <button
          onClick={() => navigate("/farm/flocks")}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Back to Flocks
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    culled: "bg-slate-100 text-slate-600 border-slate-200",
    sold: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const statusColor = statusColors[flock.status || "active"] || statusColors.active;

  const upcomingVacc = vaccinations.filter((v) => v.status === "pending");
  const completedVacc = vaccinations.filter((v) => v.status !== "pending");

  return (
    <div>
      <button
        onClick={() => navigate("/farm/flocks")}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Flocks
      </button>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{flock.batchName}</h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
              {flock.status || "active"}
            </span>
          </div>
          {flock.breed && (
            <p className="text-slate-500 mt-1">{flock.breed}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(flock.status === "active" || !flock.status) && (
            <>
              <button
                onClick={() => navigate(`/farm/flocks/${flock.id}/edit`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setShowStatusModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100 transition-colors"
              >
                Change Status
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard
          icon={<Clock className="h-4 w-4 text-amber-600" />}
          label="Current Age"
          value={formatAge(flock.ageDays)}
        />
        <StatCard
          icon={<Bird className="h-4 w-4 text-blue-600" />}
          label="Current Count"
          value={Number(flock.currentCount ?? 0).toLocaleString()}
          sub={`of ${Number(flock.initialCount ?? 0).toLocaleString()}`}
        />
        <StatCard
          icon={<Skull className="h-4 w-4 text-slate-500" />}
          label="Total Deaths"
          value={Number(flock.totalDeaths ?? 0).toLocaleString()}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          label="Mortality Rate"
          value={`${Number(flock.mortalityRate ?? 0).toFixed(1)}%`}
          warning={Number(flock.mortalityRate ?? 0) > 1}
        />
        <StatCard
          icon={<Egg className="h-4 w-4 text-orange-500" />}
          label="Total Eggs"
          value={Number(flock.totalEggs ?? 0).toLocaleString()}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
          label="Production (7d)"
          value={Number(flock.productionRate ?? 0) > 0 ? `${Number(flock.productionRate ?? 0).toFixed(1)}%` : "--"}
          warning={Number(flock.productionRate ?? 0) > 0 && Number(flock.productionRate ?? 0) < 80 && (flock.status === "active" || !flock.status)}
        />
      </div>

      <div className="flex items-center gap-1 border-b mb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("vaccinations")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "vaccinations"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Vaccinations ({vaccinations.length})
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Flock Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Batch Name</dt>
                <dd className="font-medium text-slate-900">{flock.batchName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Breed</dt>
                <dd className="font-medium text-slate-900">{flock.breed || "Not specified"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Arrival Date</dt>
                <dd className="font-medium text-slate-900">
                  {flock.arrivalDate ? new Date(flock.arrivalDate).toLocaleDateString() : "N/A"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Age at Arrival</dt>
                <dd className="font-medium text-slate-900">
                  {flock.ageAtArrivalDays || 0} days
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Initial Count</dt>
                <dd className="font-medium text-slate-900">
                  {Number(flock.initialCount ?? 0).toLocaleString()} birds
                </dd>
              </div>
              {flock.notes && (
                <div className="pt-2 border-t">
                  <dt className="text-slate-500 mb-1">Notes</dt>
                  <dd className="text-slate-700">{flock.notes}</dd>
                </div>
              )}
              {flock.statusChangedDate && (
                <div className="pt-2 border-t">
                  <dt className="text-slate-500 mb-1">
                    Status changed on {flock.statusChangedDate ? new Date(flock.statusChangedDate).toLocaleDateString() : "N/A"}
                  </dt>
                  {flock.statusNotes && (
                    <dd className="text-slate-700">{flock.statusNotes}</dd>
                  )}
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Production Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">Survival Rate</span>
                  <span className="font-medium text-slate-900">
                    {(100 - Number(flock.mortalityRate ?? 0)).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      Number(flock.mortalityRate ?? 0) > 5 ? "bg-red-500" : Number(flock.mortalityRate ?? 0) > 1 ? "bg-amber-500" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.max(0, 100 - Number(flock.mortalityRate ?? 0))}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-500">Production Rate (7d)</span>
                  <span className="font-medium text-slate-900">
                    {Number(flock.productionRate ?? 0) > 0 ? `${Number(flock.productionRate ?? 0).toFixed(1)}%` : "No data"}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      Number(flock.productionRate ?? 0) >= 80 ? "bg-green-500" : Number(flock.productionRate ?? 0) > 0 ? "bg-amber-500" : "bg-slate-200"
                    }`}
                    style={{ width: `${Math.min(100, Number(flock.productionRate ?? 0))}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {Number(flock.eggsLast7Days ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Eggs (last 7 days)</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {Number(flock.totalEggs ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500">Total Eggs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "vaccinations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const total = vaccinations.length;
                const comp = completedVacc.length;
                const rate = total > 0 ? Math.round((comp / total) * 100) : 100;
                const color = rate >= 90 ? "bg-green-100 text-green-700" : rate >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                return (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                    {rate}% compliant
                  </span>
                );
              })()}
            </div>
            <button
              onClick={() => navigate(`/farm/flocks/${flock.id}/vaccinations`)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View Full Vaccination Record
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {upcomingVacc.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-600" />
                Upcoming ({upcomingVacc.length})
              </h3>
              <div className="space-y-2">
                {upcomingVacc
                  .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <Syringe className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-slate-900">
                          {v.vaccineName}
                        </span>
                      </div>
                      <span className="text-sm text-amber-700">
                        {v.scheduledDate ? new Date(v.scheduledDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {completedVacc.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Syringe className="h-4 w-4 text-green-600" />
                Completed ({completedVacc.length})
              </h3>
              <div className="space-y-2">
                {completedVacc.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg bg-green-50 border border-green-100 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Syringe className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-slate-900">
                        {v.vaccineName}
                      </span>
                    </div>
                    <span className="text-sm text-green-700">
                      {v.administeredDate
                        ? new Date(v.administeredDate).toLocaleDateString()
                        : "Completed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vaccinations.length === 0 && (
            <div className="bg-white rounded-xl border p-12 text-center">
              <Syringe className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                No vaccinations scheduled for this flock.
              </p>
            </div>
          )}
        </div>
      )}

      {showStatusModal && (
        <ChangeStatusModal
          flockName={flock.batchName}
          onConfirm={handleChangeStatus}
          onCancel={() => setShowStatusModal(false)}
          isLoading={statusLoading}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  warning?: boolean;
}): React.ReactElement {
  return (
    <div className={`bg-white rounded-xl border p-4 ${warning ? "border-amber-200" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className={`text-lg font-bold ${warning ? "text-amber-600" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
