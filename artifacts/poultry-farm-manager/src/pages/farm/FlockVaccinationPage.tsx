import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isElectron, vaccinations, vaccinationSchedule } from "@/lib/api";
import VaccinationTimeline from "@/components/vaccinations/VaccinationTimeline";
import VaccinationComplianceCard from "@/components/vaccinations/VaccinationComplianceCard";
import AddCustomVaccinationModal from "@/components/vaccinations/AddCustomVaccinationModal";
import { generateVaccinationCSV, downloadFile } from "@/lib/exportUtils";
import type { FlockVaccinationDetailed, FlockVaccinationItem } from "@/types/electron";

type ViewMode = "timeline" | "table";

export default function FlockVaccinationPage() {
  const { flockId } = useParams<{ flockId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FlockVaccinationDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fetchData = useCallback(async () => {
    if (!flockId) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await vaccinations.getByFlockDetailed(Number(flockId));
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vaccination data");
    }
    setIsLoading(false);
  }, [flockId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddCustom(formData: { vaccineName: string; administeredDate: string; administeredBy: string; batchNumber?: string; route?: string; notes?: string }) {
    await vaccinations.addCustom(Number(flockId), formData);
    fetchData();
  }

  async function handleRegenerate() {
    if (!confirm("This will generate new pending vaccinations from the template schedule. Existing records will not be affected. Continue?")) return;
    setIsRegenerating(true);
    try {
      await vaccinationSchedule.generateForFlock(Number(flockId));
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to regenerate schedule");
    }
    setIsRegenerating(false);
  }

  function handleExport() {
    if (!data) return;
    const exportData = data.vaccinations.map(v => ({
      date: v.administeredDate || v.scheduledDate,
      flock: data.flock.batchName,
      vaccine: v.vaccineName,
      status: v.status || "pending",
      administeredBy: v.administeredBy || "",
      batchNumber: v.batchNumber || "",
      notes: v.notes || "",
    }));
    const csv = generateVaccinationCSV(exportData);
    downloadFile(csv, `${data.flock.batchName}-vaccinations.csv`, "text/csv;charset=utf-8;");
  }

  function getFlockAgeDays() {
    if (!data) return 0;
    const arrival = new Date(data.flock.arrivalDate);
    const today = new Date();
    return Math.floor((today.getTime() - arrival.getTime()) / 86400000) + (data.flock.ageAtArrivalDays || 0);
  }

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error || "No data found"}</p>
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-700">Go Back</button>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{data.flock.batchName} — Vaccinations</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
            <span>{data.flock.breed}</span>
            <span className="text-gray-300">|</span>
            <span>{data.flock.currentCount} birds</span>
            <span className="text-gray-300">|</span>
            <span>Age: {getFlockAgeDays()} days</span>
            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              data.compliance.rate >= 90 ? "bg-green-100 text-green-700" :
              data.compliance.rate >= 70 ? "bg-amber-100 text-amber-700" :
              "bg-red-100 text-red-700"
            }`}>
              {data.compliance.rate}% compliant
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VaccinationComplianceCard stats={{
          ...data.compliance,
          lastCompletedDate: data.vaccinations.filter(v => v.status === "completed").sort((a, b) => (b.administeredDate || "").localeCompare(a.administeredDate || ""))[0]?.administeredDate || null,
          lastCompletedVaccine: data.vaccinations.filter(v => v.status === "completed").sort((a, b) => (b.administeredDate || "").localeCompare(a.administeredDate || ""))[0]?.vaccineName || null,
        }} />
        <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddCustom(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Custom Vaccination
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate Schedule
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setViewMode("timeline")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            viewMode === "timeline" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Timeline View
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            viewMode === "table" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Table View
        </button>
      </div>

      {viewMode === "timeline" ? (
        <VaccinationTimeline vaccinations={data.vaccinations} />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Day</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Vaccine</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Scheduled</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Administered</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">By</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Batch #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.vaccinations.map((v: FlockVaccinationItem) => {
                  const isOverdue = v.status === "pending" && v.scheduledDate < today;
                  return (
                    <tr key={v.id} className={`hover:bg-gray-50 ${isOverdue ? "bg-orange-50" : ""}`}>
                      <td className="px-4 py-3 text-gray-600">{v.vaccAgeDays}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{v.vaccineName}</td>
                      <td className="px-4 py-3 text-gray-600">{v.scheduledDate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.status === "completed" ? "bg-green-100 text-green-700" :
                          v.status === "skipped" ? "bg-red-100 text-red-700" :
                          isOverdue ? "bg-orange-100 text-orange-700" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {v.status === "completed" ? "Completed" : v.status === "skipped" ? "Skipped" : isOverdue ? "Overdue" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{v.administeredDate || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{v.administeredBy || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{v.batchNumber || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{v.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddCustom && (
        <AddCustomVaccinationModal
          flockId={Number(flockId)}
          flockName={data.flock.batchName}
          onSubmit={handleAddCustom}
          onClose={() => setShowAddCustom(false)}
        />
      )}
    </div>
  );
}
