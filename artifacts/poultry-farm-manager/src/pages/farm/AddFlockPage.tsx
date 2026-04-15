import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isElectron } from "@/lib/api";
import { generateBatchName } from "@/lib/utils";
import BreedSelector from "@/components/flocks/BreedSelector";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useFarmId } from "@/hooks/useFarmId";
import { useFarmPath } from "@/hooks/useFarmPath";

const flockSchema = z.object({
  batchName: z.string().min(1, "Batch name is required"),
  breed: z.string().optional(),
  initialCount: z.number().int("Must be a whole number").min(1, "At least 1 bird").max(100000, "Maximum 100,000 birds"),
  arrivalDate: z.string().min(1, "Arrival date is required").refine(
    (d) => new Date(d) <= new Date(),
    "Arrival date cannot be in the future"
  ),
  ageAtArrivalDays: z.number().int().min(0, "Cannot be negative").max(365, "Maximum 365 days").default(0),
  notes: z.string().optional(),
});

export default function AddFlockPage(): React.ReactElement {
  const farmId = useFarmId();
  const farmPath = useFarmPath();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    batchName: "",
    breed: "",
    initialCount: "",
    arrivalDate: new Date().toISOString().split("T")[0],
    ageAtArrivalDays: "0",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadBatchName = async () => {
      if (!isElectron() || !farmId) return;
      try {
        const result = await window.electronAPI.flocks.getByFarm(farmId);
        if (result.success && result.data) {
          const existing = (result.data as { batchName: string }[]).map((f) => f.batchName);
          setFormData((prev) => ({ ...prev, batchName: generateBatchName(existing) }));
        }
      } catch {
        // use empty name
      }
    };
    loadBatchName();
  }, [farmId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const parsed = flockSchema.safeParse({
      ...formData,
      initialCount: formData.initialCount ? parseInt(formData.initialCount, 10) : undefined,
      ageAtArrivalDays: formData.ageAtArrivalDays ? parseInt(formData.ageAtArrivalDays, 10) : 0,
      breed: formData.breed || undefined,
      notes: formData.notes || undefined,
    });

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    if (!isElectron() || !farmId) {
      setError("This feature is only available in the desktop app");
      return;
    }

    setIsLoading(true);

    try {
      const result = await window.electronAPI.flocks.create({
        farmId,
        batchName: parsed.data.batchName,
        breed: parsed.data.breed,
        initialCount: parsed.data.initialCount,
        currentCount: parsed.data.initialCount,
        arrivalDate: parsed.data.arrivalDate,
        ageAtArrivalDays: parsed.data.ageAtArrivalDays,
        notes: parsed.data.notes,
      });

      if (result.success && result.data) {
        const flock = result.data as { id: number };
        navigate(farmPath(`flocks/${flock.id}`), { replace: true });
      } else {
        setError(result.error || "Failed to create flock");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
      fieldErrors[field]
        ? "border-destructive bg-destructive/5"
        : "border-input bg-background"
    }`;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Add New Flock</h2>
        <p className="text-slate-500 mt-1">
          Register a new batch of birds to start tracking.
        </p>
      </div>

      <div className="max-w-xl">
        <div className="bg-white rounded-xl border p-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="batchName" className="text-sm font-medium text-slate-700">
                Batch Name <span className="text-red-500">*</span>
              </label>
              <input
                id="batchName"
                name="batchName"
                type="text"
                value={formData.batchName}
                onChange={handleChange}
                placeholder="e.g., Batch-2026-001"
                className={inputClass("batchName")}
                disabled={isLoading}
                autoFocus
              />
              {fieldErrors.batchName && (
                <p className="text-xs text-destructive">{fieldErrors.batchName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Breed</label>
              <BreedSelector
                value={formData.breed}
                onChange={(v) => setFormData((prev) => ({ ...prev, breed: v }))}
                disabled={isLoading}
                className={inputClass("breed")}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="initialCount" className="text-sm font-medium text-slate-700">
                Initial Bird Count <span className="text-red-500">*</span>
              </label>
              <input
                id="initialCount"
                name="initialCount"
                type="number"
                value={formData.initialCount}
                onChange={handleChange}
                placeholder="e.g., 5000"
                min="1"
                max="100000"
                className={inputClass("initialCount")}
                disabled={isLoading}
              />
              {fieldErrors.initialCount && (
                <p className="text-xs text-destructive">{fieldErrors.initialCount}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="arrivalDate" className="text-sm font-medium text-slate-700">
                  Arrival Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="arrivalDate"
                  name="arrivalDate"
                  type="date"
                  value={formData.arrivalDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className={inputClass("arrivalDate")}
                  disabled={isLoading}
                />
                {fieldErrors.arrivalDate && (
                  <p className="text-xs text-destructive">{fieldErrors.arrivalDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="ageAtArrivalDays" className="text-sm font-medium text-slate-700">
                  Age at Arrival (days)
                </label>
                <input
                  id="ageAtArrivalDays"
                  name="ageAtArrivalDays"
                  type="number"
                  value={formData.ageAtArrivalDays}
                  onChange={handleChange}
                  min="0"
                  max="365"
                  className={inputClass("ageAtArrivalDays")}
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-400">0 for day-old chicks</p>
                {fieldErrors.ageAtArrivalDays && (
                  <p className="text-xs text-destructive">{fieldErrors.ageAtArrivalDays}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-slate-700">
                Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes about this batch..."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Flock"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(farmPath("flocks"))}
                disabled={isLoading}
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
