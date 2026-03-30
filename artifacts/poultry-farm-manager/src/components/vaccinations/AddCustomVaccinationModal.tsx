import { useState } from "react";

interface Props {
  flockId: number;
  flockName: string;
  onSubmit: (data: {
    vaccineName: string;
    administeredDate: string;
    administeredBy: string;
    batchNumber?: string;
    route?: string;
    notes?: string;
  }) => Promise<void>;
  onClose: () => void;
}

const ROUTES = ["Drinking Water", "Eye Drop", "Spray", "Injection (SC)", "Injection (IM)", "Wing Web", "Other"];

export default function AddCustomVaccinationModal({ flockName, onSubmit, onClose }: Props) {
  const [vaccineName, setVaccineName] = useState("");
  const [administeredDate, setAdministeredDate] = useState(new Date().toISOString().split("T")[0]);
  const [administeredBy, setAdministeredBy] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [route, setRoute] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!vaccineName.trim()) { setError("Vaccine name is required"); return; }
    if (!administeredDate) { setError("Date is required"); return; }
    if (!administeredBy.trim()) { setError("Administered by is required"); return; }

    setIsSubmitting(true);
    try {
      await onSubmit({
        vaccineName: vaccineName.trim(),
        administeredDate,
        administeredBy: administeredBy.trim(),
        batchNumber: batchNumber.trim() || undefined,
        route: route || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vaccination");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add Custom Vaccination</h3>
          <p className="text-sm text-gray-500 mt-1">Record a vaccination for {flockName}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vaccine Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={vaccineName}
              onChange={e => setVaccineName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Newcastle Disease"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Administered <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={administeredDate}
              onChange={e => setAdministeredDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Administered By <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={administeredBy}
              onChange={e => setAdministeredBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Dr. Ali"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input
              type="text"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., NK-2024-001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
            <select
              value={route}
              onChange={e => setRoute(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select route...</option>
              {ROUTES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Vaccination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
