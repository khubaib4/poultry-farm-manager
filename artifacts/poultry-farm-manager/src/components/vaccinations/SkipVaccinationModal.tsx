import React, { useState } from "react";
import { X, SkipForward } from "lucide-react";
import type { UpcomingVaccination, SkipVaccinationData } from "@/types/electron";

interface SkipVaccinationModalProps {
  vaccination: UpcomingVaccination;
  onConfirm: (id: number, data: SkipVaccinationData) => Promise<void>;
  onClose: () => void;
}

const SKIP_REASONS = [
  "Not needed",
  "Rescheduled",
  "Flock issue",
  "Vaccine unavailable",
  "Other",
];

export default function SkipVaccinationModal({ vaccination, onConfirm, onClose }: SkipVaccinationModalProps): React.ReactElement {
  const [reason, setReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSaving(true);
    try {
      await onConfirm(vaccination.id, {
        reason,
        rescheduleDate: rescheduleDate || undefined,
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
            <SkipForward className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">Skip Vaccination</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
            <p className="text-sm font-medium text-amber-900">{vaccination.vaccineName}</p>
            <p className="text-xs text-amber-700 mt-0.5">{vaccination.flockName} &middot; Scheduled: {new Date(vaccination.scheduledDate).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              <option value="">Select a reason...</option>
              {SKIP_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reschedule To (optional)</label>
            <input
              type="date"
              value={rescheduleDate}
              onChange={e => setRescheduleDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            <p className="text-xs text-gray-400 mt-1">Leave blank to skip without rescheduling</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional details..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button type="submit" disabled={saving || !reason} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? "Saving..." : rescheduleDate ? "Skip & Reschedule" : "Skip Vaccination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
