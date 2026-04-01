import React, { useState, useEffect } from "react";
import { X, Users } from "lucide-react";
import { flocks as flocksApi, vaccinationSchedule as schedApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/Toast";

interface Flock {
  id: number;
  batchName: string;
  currentCount: number | null;
  arrivalDate: string;
  ageAtArrivalDays: number | null;
  status: string | null;
}

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyTemplateModal({ isOpen, onClose, onSuccess }: ApplyTemplateModalProps): React.ReactElement | null {
  const { user } = useAuth();
  const { toast } = useToast();
  const farmId = user?.farmId ?? null;
  const [flockList, setFlockList] = useState<Flock[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!isOpen || !farmId) return;
    setLoading(true);
    flocksApi.getByFarm(farmId).then((data: Flock[]) => {
      const active = data.filter((f: Flock) => f.status === "active");
      setFlockList(active);
      setSelected(new Set());
      setLoading(false);
    }).catch(() => {
      setFlockList([]);
      setLoading(false);
    });
  }, [isOpen, farmId]);

  if (!isOpen) return null;

  function getFlockAge(flock: Flock): number {
    const arrivalMs = new Date(flock.arrivalDate).getTime();
    const ageAtArrival = flock.ageAtArrivalDays || 0;
    return Math.floor((Date.now() - arrivalMs) / 86400000) + ageAtArrival;
  }

  function toggleFlock(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === flockList.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(flockList.map(f => f.id)));
    }
  }

  async function handleApply() {
    if (!farmId || selected.size === 0) return;
    setApplying(true);
    try {
      const result = await schedApi.applyToFlocks(farmId, Array.from(selected));
      onClose();
      toast.success(`Template applied! ${result.count} vaccination(s) scheduled.`);
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Apply Template to Flocks</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-3">
            Select flocks to apply the vaccination template to. Existing scheduled vaccinations will not be duplicated.
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading flocks...</p>
            </div>
          ) : flockList.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active flocks found.</p>
            </div>
          ) : (
            <>
              <label className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.size === flockList.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Select All ({flockList.length})</span>
              </label>
              <div className="space-y-2">
                {flockList.map(flock => {
                  const age = getFlockAge(flock);
                  return (
                    <label key={flock.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(flock.id)}
                        onChange={() => toggleFlock(flock.id)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{flock.batchName}</p>
                        <p className="text-xs text-gray-500">
                          {flock.currentCount ?? 0} birds &middot; {age} days old
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={applying || selected.size === 0}
            className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying ? "Applying..." : `Apply to ${selected.size} Flock${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
