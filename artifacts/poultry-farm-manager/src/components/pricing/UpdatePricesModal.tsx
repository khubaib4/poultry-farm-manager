import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface GradePrice {
  grade: string;
  pricePerEgg: number;
  pricePerTray: number;
}

interface UpdatePricesModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (prices: GradePrice[], effectiveDate: string) => Promise<void>;
  currentPrices?: Record<string, { pricePerEgg: number; pricePerTray: number } | null>;
}

const grades = [
  { key: "A", label: "Grade A" },
  { key: "B", label: "Grade B" },
  { key: "cracked", label: "Cracked" },
];

export default function UpdatePricesModal({ open, onClose, onSave, currentPrices }: UpdatePricesModalProps): React.ReactElement {
  const today = new Date().toISOString().split("T")[0];
  const [mode, setMode] = useState<"egg" | "tray">("egg");
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [values, setValues] = useState<Record<string, string>>({ A: "", B: "", cracked: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setEffectiveDate(today);
      setError("");
      setMode("egg");
      const v: Record<string, string> = {};
      for (const g of grades) {
        const cp = currentPrices?.[g.key];
        v[g.key] = cp ? String(cp.pricePerEgg) : "";
      }
      setValues(v);
    }
  }, [open, currentPrices, today]);

  function getComputedPrices(): GradePrice[] {
    return grades.map(g => {
      const raw = parseFloat(values[g.key] || "0");
      const perEgg = mode === "egg" ? raw : raw / 30;
      const perTray = mode === "egg" ? raw * 30 : raw;
      return { grade: g.key, pricePerEgg: Math.round(perEgg * 100) / 100, pricePerTray: Math.round(perTray * 100) / 100 };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (effectiveDate > today) {
      setError("Effective date cannot be in the future.");
      return;
    }
    const computed = getComputedPrices();
    const gradeA = computed.find(p => p.grade === "A");
    if (!gradeA || gradeA.pricePerEgg <= 0) {
      setError("Grade A price is required and must be positive.");
      return;
    }
    for (const p of computed) {
      if (p.pricePerEgg < 0 || p.pricePerTray < 0) {
        setError("Prices cannot be negative.");
        return;
      }
    }
    const toSave = computed.filter(p => p.pricePerEgg > 0);
    if (toSave.length === 0) {
      setError("At least one price must be set.");
      return;
    }
    setSaving(true);
    try {
      await onSave(toSave, effectiveDate);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save prices");
    } finally {
      setSaving(false);
    }
  }

  const computed = getComputedPrices();

  if (!open) return <></>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-[500px] mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">Update Egg Prices</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setMode("egg")}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${mode === "egg" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              Set Per Egg
            </button>
            <button
              type="button"
              onClick={() => setMode("tray")}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${mode === "tray" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            >
              Set Per Tray (30)
            </button>
          </div>

          <div className="space-y-3">
            {grades.map(g => (
              <div key={g.key} className="flex items-center gap-3">
                <label className="w-24 text-sm font-medium text-gray-700">{g.label}</label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">PKR</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={values[g.key]}
                    onChange={e => setValues(v => ({ ...v, [g.key]: e.target.value }))}
                    className="w-full pl-12 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
            <input
              type="date"
              value={effectiveDate}
              max={today}
              onChange={e => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Price Preview</h4>
            <div className="space-y-2">
              {computed.filter(p => p.pricePerEgg > 0).map(p => (
                <div key={p.grade} className="flex justify-between text-sm">
                  <span className="text-gray-600">{grades.find(g => g.key === p.grade)?.label}</span>
                  <span className="text-gray-900">
                    {formatCurrency(p.pricePerEgg)}/egg &middot; {formatCurrency(p.pricePerTray)}/tray
                  </span>
                </div>
              ))}
              {computed.every(p => p.pricePerEgg === 0) && (
                <p className="text-sm text-gray-400">Enter prices above to see preview</p>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Prices"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
