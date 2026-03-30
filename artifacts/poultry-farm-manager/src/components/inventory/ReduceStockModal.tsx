import React, { useState } from "react";
import { X } from "lucide-react";
import type { InventoryItem } from "@/types/electron";

interface ReduceStockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSubmit: (data: { quantity: number; date: string; reason: string; notes?: string }) => Promise<void>;
}

const REASONS = ["Used", "Damaged", "Expired", "Other"];

export default function ReduceStockModal({ item, onClose, onSubmit }: ReduceStockModalProps): React.ReactElement {
  const todayStr = new Date().toISOString().split("T")[0];
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(todayStr);
  const [reason, setReason] = useState("Used");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { setError("Quantity must be greater than 0"); return; }
    if (qty > item.quantity) { setError(`Cannot reduce more than current stock (${item.quantity} ${item.unit})`); return; }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        quantity: qty,
        date,
        reason,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reduce stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Reduce Stock — {item.itemName}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            Current Stock: <span className="font-semibold">{item.quantity} {item.unit}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Remove ({item.unit}) *</label>
            <input type="number" step="any" min="0.01" max={item.quantity} value={quantity} onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <select value={reason} onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
              {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {saving ? "Reducing..." : "Reduce Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
