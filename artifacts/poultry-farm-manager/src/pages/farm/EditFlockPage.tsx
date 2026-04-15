import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isElectron } from "@/lib/api";
import { formatAge } from "@/lib/utils";
import BreedSelector from "@/components/flocks/BreedSelector";
import { Loader2, ArrowLeft } from "lucide-react";

interface FlockDetail {
  id: number;
  batchName: string;
  breed?: string | null;
  initialCount: number;
  currentCount: number;
  arrivalDate: string;
  ageAtArrivalDays?: number | null;
  ageDays: number;
  notes?: string | null;
}

export default function EditFlockPage(): React.ReactElement {
  const { flockId } = useParams<{ flockId: string }>();
  const navigate = useNavigate();
  const [flock, setFlock] = useState<FlockDetail | null>(null);
  const [formData, setFormData] = useState({
    batchName: "",
    breed: "",
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFlock = async () => {
      if (!isElectron() || !flockId) {
        setIsLoading(false);
        return;
      }
      try {
        const result = await window.electronAPI.flocks.getById(parseInt(flockId, 10));
        if (result.success && result.data) {
          const f = result.data as FlockDetail;
          setFlock(f);
          setFormData({
            batchName: f.batchName,
            breed: f.breed || "",
            notes: f.notes || "",
          });
        } else {
          setError(result.error || "Flock not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load flock");
      } finally {
        setIsLoading(false);
      }
    };
    loadFlock();
  }, [flockId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isElectron() || !flockId) return;
    if (!formData.batchName.trim()) {
      setError("Batch name is required");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await window.electronAPI.flocks.update(parseInt(flockId, 10), {
        batchName: formData.batchName.trim(),
        breed: formData.breed || undefined,
        notes: formData.notes || undefined,
      } as Partial<import("@/types/electron").FlockData>);

      if (result.success) {
        navigate(`/farm/flocks/${flockId}`, { replace: true });
      } else {
        setError(result.error || "Failed to update flock");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flock");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!flock) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{error || "Flock not found"}</p>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(`/farm/flocks/${flockId}`)}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Flock
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Edit Flock</h2>
        <p className="text-slate-500 mt-1">
          Update editable flock information.
        </p>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-xl border p-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          <div className="rounded-lg bg-slate-50 border p-4 mb-6">
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
              Read-Only Information
            </h4>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Initial Count</dt>
                <dd className="font-medium text-slate-900">
                  {Number(flock.initialCount ?? 0).toLocaleString()} birds
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Arrival Date</dt>
                <dd className="font-medium text-slate-900">
                  {flock.arrivalDate ? new Date(flock.arrivalDate).toLocaleDateString() : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Age at Arrival</dt>
                <dd className="font-medium text-slate-900">
                  {flock.ageAtArrivalDays || 0} days
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Current Age</dt>
                <dd className="font-medium text-slate-900">
                  {formatAge(flock.ageDays)}
                </dd>
              </div>
            </dl>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="batchName" className="text-sm font-medium text-slate-700">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                id="batchName"
                type="text"
                value={formData.batchName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, batchName: e.target.value }))
                }
                className={inputClass}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Breed</label>
              <BreedSelector
                value={formData.breed}
                onChange={(v) => setFormData((prev) => ({ ...prev, breed: v }))}
                disabled={isSaving}
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(`/farm/flocks/${flockId}`)}
                disabled={isSaving}
                className="rounded-lg border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
