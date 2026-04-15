import React, { useState } from "react";
import { Edit, Trash2, Egg, Skull, Wheat, Droplets, AlertTriangle } from "lucide-react";

interface EntryData {
  id: number;
  flockId: number;
  entryDate: string;
  deaths: number;
  deathCause?: string | null;
  eggsGradeA: number;
  eggsGradeB: number;
  eggsCracked: number;
  feedConsumedKg: number;
  waterConsumedLiters?: number | null;
  notes?: string | null;
}

interface ExistingEntryCardProps {
  entry: EntryData;
  openingStock: number;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  /** Hide edit/delete (owner read-only farm view). */
  readOnly?: boolean;
}

export default function ExistingEntryCard({
  entry,
  openingStock,
  onEdit,
  onDelete,
  isDeleting,
  readOnly,
}: ExistingEntryCardProps): React.ReactElement {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const totalEggs = (entry.eggsGradeA || 0) + (entry.eggsGradeB || 0) + (entry.eggsCracked || 0);
  const closingStock = openingStock - (entry.deaths || 0);
  const productionRate = closingStock > 0 ? ((totalEggs / closingStock) * 100).toFixed(1) : "0.0";
  const mortalityPct = openingStock > 0 ? (((entry.deaths || 0) / openingStock) * 100) : 0;
  const feedPerBird = closingStock > 0 ? ((entry.feedConsumedKg || 0) / closingStock * 1000).toFixed(0) : "0";

  return (
    <div className="border border-green-200 bg-green-50/50 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-semibold text-green-800">Entry Recorded</span>
        </div>
        {!readOnly && onEdit && onDelete && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={onEdit} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => { onDelete(); setShowDeleteConfirm(false); }} disabled={isDeleting} className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {isDeleting ? "..." : "Confirm"}
                </button>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <Skull className="w-3.5 h-3.5" /> Mortality
          </div>
          <div className="text-lg font-bold text-gray-900">{entry.deaths || 0}</div>
          {mortalityPct > 0.5 && (
            <div className="flex items-center gap-1 text-xs text-amber-600 mt-0.5">
              <AlertTriangle className="w-3 h-3" /> {mortalityPct.toFixed(1)}%
            </div>
          )}
          {entry.deathCause && <div className="text-xs text-gray-500 mt-0.5">{entry.deathCause}</div>}
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <Egg className="w-3.5 h-3.5" /> Eggs
          </div>
          <div className="text-lg font-bold text-gray-900">{totalEggs}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            A:{entry.eggsGradeA || 0} B:{entry.eggsGradeB || 0} C:{entry.eggsCracked || 0}
          </div>
          <div className="text-xs text-green-600 mt-0.5">{productionRate}% rate</div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <Wheat className="w-3.5 h-3.5" /> Feed
          </div>
          <div className="text-lg font-bold text-gray-900">{entry.feedConsumedKg || 0} kg</div>
          <div className="text-xs text-gray-500 mt-0.5">{feedPerBird}g/bird</div>
        </div>

        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <Droplets className="w-3.5 h-3.5" /> Stock
          </div>
          <div className="text-lg font-bold text-gray-900">{closingStock}</div>
          <div className="text-xs text-gray-500 mt-0.5">from {openingStock}</div>
        </div>
      </div>

      {entry.notes && (
        <div className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100">
          <span className="font-medium text-gray-700">Notes: </span>{entry.notes}
        </div>
      )}
    </div>
  );
}
