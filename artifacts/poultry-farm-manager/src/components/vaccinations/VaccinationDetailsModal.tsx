import React from "react";
import { X, Pencil } from "lucide-react";
import type { CompletedVaccination } from "@/types/electron";

const routeLabels: Record<string, string> = {
  eye_drop: "Eye Drop",
  drinking_water: "Drinking Water",
  injection: "Injection",
  spray: "Spray",
  wing_web: "Wing Web",
  oral: "Oral",
};

interface VaccinationDetailsModalProps {
  vaccination: CompletedVaccination;
  onClose: () => void;
  onEdit: (id: number) => void;
}

export default function VaccinationDetailsModal({ vaccination, onClose, onEdit }: VaccinationDetailsModalProps): React.ReactElement {
  const v = vaccination;
  const statusLabel = v.status === "completed" ? "Completed" : v.status === "skipped" ? "Skipped" : "Pending";
  const statusClass = v.status === "completed"
    ? "bg-green-100 text-green-700"
    : v.status === "skipped"
    ? "bg-gray-100 text-gray-600"
    : "bg-blue-100 text-blue-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-200">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900">{v.vaccineName}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{v.flockName}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <DetailRow label="Scheduled Date" value={v.scheduledDate ? new Date(v.scheduledDate).toLocaleDateString() : "—"} />
            <DetailRow label="Administered Date" value={v.administeredDate ? new Date(v.administeredDate).toLocaleDateString() : "—"} />
            <DetailRow label="Administered By" value={v.administeredBy || "—"} />
            <DetailRow label="Batch Number" value={v.batchNumber || "—"} />
          </div>

          <div className="border-t border-gray-100" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <DetailRow label="Route" value={v.route ? (routeLabels[v.route] || v.route) : "—"} />
            <DetailRow label="Dosage" value={v.dosage || "—"} />
          </div>

          {v.notes && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg px-3 py-2">{v.notes}</p>
              </div>
            </>
          )}

          {v.createdAt && (
            <>
              <div className="border-t border-gray-100" />
              <div>
                <p className="text-xs text-gray-400">Record created: {new Date(v.createdAt).toLocaleString()}</p>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={() => { onClose(); onEdit(v.id); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}
