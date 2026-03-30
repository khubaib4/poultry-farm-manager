import React, { useState } from "react";
import { X } from "lucide-react";
import type { InventoryItem } from "@/types/electron";

interface AddStockModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSubmit: (data: { quantity: number; date: string; supplier?: string; cost?: number; expiryDate?: string; notes?: string }) => Promise<void>;
}

export default function AddStockModal({ item, onClose, onSubmit }: AddStockModalProps): React.ReactElement {
  const todayStr = new Date().toISOString().split("T")[0];
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(todayStr);
  const [supplier, setSupplier] = useState("");
  const [cost, setCost] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { setError("Quantity must be greater than 0"); return; }
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        quantity: qty,
        date,
        supplier: supplier || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        expiryDate: expiryDate || undefined,
        notes: notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add stock");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Add Stock — {item.itemName}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add ({item.unit}) *</label>
            <input type="number" step="any" min="0.01" value={quantity} onChange={e => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost (PKR)</label>
            <input type="number" step="any" min="0" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>

          {item.itemType === "medicine" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Expiry Date</label>
              <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {saving ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
