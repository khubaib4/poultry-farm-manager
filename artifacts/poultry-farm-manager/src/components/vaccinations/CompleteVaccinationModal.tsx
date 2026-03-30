import React, { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { UpcomingVaccination, CompleteVaccinationData } from "@/types/electron";

interface CompleteVaccinationModalProps {
  vaccination: UpcomingVaccination;
  onConfirm: (id: number, data: CompleteVaccinationData) => Promise<void>;
  onClose: () => void;
}

export default function CompleteVaccinationModal({ vaccination, onConfirm, onClose }: CompleteVaccinationModalProps): React.ReactElement {
  const [administeredDate, setAdministeredDate] = useState(new Date().toISOString().split("T")[0]);
  const [administeredBy, setAdministeredBy] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onConfirm(vaccination.id, {
        administeredDate,
        administeredBy: administeredBy || undefined,
        batchNumber: batchNumber || undefined,
        notes: notes || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Complete Vaccination</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{vaccination.vaccineName}</p>
            <p className="text-xs text-gray-500 mt-0.5">{vaccination.flockName} &middot; Scheduled: {new Date(vaccination.scheduledDate).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Administered Date *</label>
            <input
              type="date"
              value={administeredDate}
              onChange={e => setAdministeredDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Administered By</label>
            <input
              type="text"
              value={administeredBy}
              onChange={e => setAdministeredBy(e.target.value)}
              placeholder="Name of person"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
            <input
              type="text"
              value={batchNumber}
              onChange={e => setBatchNumber(e.target.value)}
              placeholder="Vaccine batch/lot number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {saving ? "Saving..." : "Mark Complete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
