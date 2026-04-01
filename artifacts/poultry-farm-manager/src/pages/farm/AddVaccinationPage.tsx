import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Syringe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { flocks as flocksApi, vaccinations as vaccApi } from "@/lib/api";
import VaccineSelector from "@/components/vaccinations/VaccineSelector";

const routeOptions = [
  { value: "eye_drop", label: "Eye Drop" },
  { value: "drinking_water", label: "Drinking Water" },
  { value: "injection", label: "Injection" },
  { value: "spray", label: "Spray" },
  { value: "wing_web", label: "Wing Web" },
  { value: "oral", label: "Oral" },
];

interface FlockOption {
  id: number;
  batchName: string;
  status: string | null;
}

export default function AddVaccinationPage(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const farmId = user?.farmId ?? null;

  const [flockList, setFlockList] = useState<FlockOption[]>([]);
  const [flockId, setFlockId] = useState<string>("");
  const [vaccineName, setVaccineName] = useState("");
  const [statusType, setStatusType] = useState<"pending" | "completed">("pending");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [administeredDate, setAdministeredDate] = useState(new Date().toISOString().split("T")[0]);
  const [dosage, setDosage] = useState("");
  const [route, setRoute] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!farmId) return;
    flocksApi.getByFarm(farmId).then((data: FlockOption[]) => {
      setFlockList(data.filter((f: FlockOption) => f.status === "active"));
    }).catch(() => setFlockList([]));
  }, [farmId]);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!flockId) errs.flockId = "Please select a flock";
    if (!vaccineName.trim()) errs.vaccineName = "Vaccine name is required";
    if (!route) errs.route = "Route is required";
    if (statusType === "pending" && !scheduledDate) errs.scheduledDate = "Scheduled date is required";
    if (statusType === "completed" && !administeredDate) errs.administeredDate = "Date administered is required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        flockId: Number(flockId),
        vaccineName: vaccineName.trim(),
        scheduledDate: statusType === "completed" ? administeredDate : scheduledDate,
        status: statusType,
        dosage: dosage.trim() || null,
        route: route || null,
        notes: notes.trim() || null,
      };
      if (statusType === "completed") {
        data.administeredDate = administeredDate;
      }
      await vaccApi.create(data as never);
      navigate("/farm/vaccinations");
      toast.success("Vaccination added successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save vaccination");
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/farm/vaccinations")}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
          <Syringe className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Vaccination</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record a new vaccination for a flock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Flock <span className="text-red-500">*</span>
          </label>
          <select
            value={flockId}
            onChange={e => setFlockId(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.flockId ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          >
            <option value="">Select a flock...</option>
            {flockList.map(f => (
              <option key={f.id} value={f.id}>{f.batchName}</option>
            ))}
          </select>
          {errors.flockId && <p className="text-xs text-red-600 mt-1">{errors.flockId}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vaccine Name <span className="text-red-500">*</span>
          </label>
          <VaccineSelector
            value={vaccineName}
            onChange={(name, defaultRoute) => {
              setVaccineName(name);
              if (defaultRoute && !route) setRoute(defaultRoute);
            }}
            error={!!errors.vaccineName}
          />
          {errors.vaccineName && <p className="text-xs text-red-600 mt-1">{errors.vaccineName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="statusType"
                value="pending"
                checked={statusType === "pending"}
                onChange={() => setStatusType("pending")}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Schedule for Later</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="statusType"
                value="completed"
                checked={statusType === "completed"}
                onChange={() => setStatusType("completed")}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Mark as Completed</span>
            </label>
          </div>
        </div>

        {statusType === "pending" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.scheduledDate ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.scheduledDate && <p className="text-xs text-red-600 mt-1">{errors.scheduledDate}</p>}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Administered <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={administeredDate}
              onChange={e => setAdministeredDate(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.administeredDate ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
            />
            {errors.administeredDate && <p className="text-xs text-red-600 mt-1">{errors.administeredDate}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dosage / Quantity</label>
          <input
            type="text"
            value={dosage}
            onChange={e => setDosage(e.target.value)}
            placeholder='e.g., "500 doses", "2ml/bird"'
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Route <span className="text-red-500">*</span>
          </label>
          <select
            value={route}
            onChange={e => setRoute(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              errors.route ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          >
            <option value="">Select route...</option>
            {routeOptions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.route && <p className="text-xs text-red-600 mt-1">{errors.route}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate("/farm/vaccinations")}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
