import React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, PlusCircle, PartyPopper } from "lucide-react";
import { useFarmPath } from "@/hooks/useFarmPath";
import { useOwnerFarmReadOnly } from "@/hooks/useFarmId";

interface FlockEntry {
  id: number;
  batchName: string;
  hasEntryToday: boolean;
}

interface EntryStatusWidgetProps {
  flocks: FlockEntry[];
  completed: number;
  total: number;
}

export default function EntryStatusWidget({ flocks, completed, total }: EntryStatusWidgetProps): React.ReactElement {
  const navigate = useNavigate();
  const farmPath = useFarmPath();
  const readOnly = useOwnerFarmReadOnly();
  const allComplete = total > 0 && completed === total;
  const percentComplete = total > 0 ? Math.round((completed / total) * 100) : 0;
  const pendingFlocks = flocks.filter(f => !f.hasEntryToday);

  return (
    <div className="bg-white rounded-xl border shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Today's Entries</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={() => navigate(farmPath("daily-entry"))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add Entry
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="text-gray-600">{completed} of {total} flocks recorded</span>
          <span className="font-medium text-gray-900">{percentComplete}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${allComplete ? "bg-green-500" : "bg-primary"}`}
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {allComplete ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <PartyPopper className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-700">All flocks recorded for today!</p>
        </div>
      ) : pendingFlocks.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Pending</p>
          {pendingFlocks.map(f => (
            <button
              key={f.id}
              onClick={() => navigate(farmPath("daily-entry"))}
              className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <span className="text-sm text-gray-700">{f.batchName}</span>
              <span className="text-xs text-primary font-medium">Record</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">No active flocks</p>
      )}
    </div>
  );
}
