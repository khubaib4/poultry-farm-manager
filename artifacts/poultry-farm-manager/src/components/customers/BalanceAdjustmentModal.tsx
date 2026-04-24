import React, { useMemo, useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { customerBalance as customerBalanceApi } from "@/lib/api";
import { formatCurrency, getTodayString } from "@/lib/utils";

interface Props {
  farmId: number;
  customerId: number;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BalanceAdjustmentModal({
  farmId,
  customerId,
  customerName,
  onClose,
  onSuccess,
}: Props): React.ReactElement {
  const { showToast } = useToast();

  const today = useMemo(() => getTodayString(), []);
  const [mode, setMode] = useState<"add" | "deduct">("add");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const parsedAmount = Number(amount);
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && Boolean(date) && notes.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || saving) return;
    try {
      setSaving(true);
      const signed = mode === "add" ? Math.abs(parsedAmount) : -Math.abs(parsedAmount);
      await customerBalanceApi.addAdjustment({
        farmId,
        customerId,
        amount: signed,
        date,
        notes: notes.trim(),
      });
      showToast(`Balance adjustment saved (${formatCurrency(signed)})`, "success");
      onClose();
      onSuccess();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save adjustment", "error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Balance Adjustment</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add or deduct from {customerName}&apos;s balance</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("add")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  mode === "add" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Add to Balance
              </button>
              <button
                type="button"
                onClick={() => setMode("deduct")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  mode === "deduct" ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Deduct from Balance
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">PKR</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason / Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain why this adjustment is being made..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

