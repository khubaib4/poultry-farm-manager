import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ChangeStatusModalProps {
  flockName: string;
  onConfirm: (status: string, date: string, notes: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ChangeStatusModal({
  flockName,
  onConfirm,
  onCancel,
  isLoading,
}: ChangeStatusModalProps): React.ReactElement {
  const [status, setStatus] = useState("culled");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const inputClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-semibold text-slate-900">Change Flock Status</h2>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              This will archive <strong>{flockName}</strong>. Archived flocks
              cannot be reactivated. Daily entries and vaccinations will be
              preserved.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">New Status</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="culled"
                  checked={status === "culled"}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700">Culled</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="sold"
                  checked={status === "sold"}
                  onChange={(e) => setStatus(e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-700">Sold</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for status change..."
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(status, date, notes)}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Confirm Status Change"}
          </button>
        </div>
      </div>
    </div>
  );
}
