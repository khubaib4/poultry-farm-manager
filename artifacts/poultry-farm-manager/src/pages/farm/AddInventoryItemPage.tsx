import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, inventory as inventoryApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const ITEM_TYPES = [
  { value: "feed", label: "Feed" },
  { value: "medicine", label: "Medicine" },
  { value: "equipment", label: "Equipment" },
];

const UNITS = ["bags", "kg", "pieces", "doses", "liters", "boxes"];

export default function AddInventoryItemPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = user?.farmId ?? null;

  const [itemType, setItemType] = useState("feed");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("bags");
  const [minThreshold, setMinThreshold] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!farmId) return;
    if (itemName.trim().length < 2) { setError("Item name must be at least 2 characters"); return; }
    if (itemName.trim().length > 100) { setError("Item name must be 100 characters or less"); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty < 0) { setError("Quantity must be a non-negative number"); return; }
    const thresh = minThreshold ? parseFloat(minThreshold) : undefined;
    if (thresh !== undefined && (isNaN(thresh) || thresh < 0)) { setError("Threshold must be a non-negative number"); return; }

    setSaving(true);
    setError("");
    try {
      await inventoryApi.create({
        farmId,
        itemType,
        itemName: itemName.trim(),
        quantity: qty,
        unit,
        minThreshold: thresh,
        expiryDate: expiryDate || undefined,
        supplier: supplier || undefined,
        notes: notes || undefined,
      });
      navigate("/farm/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setSaving(false);
    }
  }

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          This feature is only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/farm/inventory")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Inventory Item</h1>
          <p className="text-sm text-gray-500 mt-0.5">Add a new item to track in your inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Type *</label>
          <div className="flex items-center gap-2">
            {ITEM_TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setItemType(t.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${itemType === t.value ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
          <input type="text" value={itemName} onChange={e => setItemName(e.target.value)}
            placeholder="e.g. Layer Feed Premium" maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input type="number" step="any" min="0" value={quantity} onChange={e => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select value={unit} onChange={e => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Threshold (for low stock alerts)</label>
          <input type="number" step="any" min="0" value={minThreshold} onChange={e => setMinThreshold(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>

        {(itemType === "medicine") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none" />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={() => navigate("/farm/inventory")}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? "Saving..." : "Add Item"}
          </button>
        </div>
      </form>
    </div>
  );
}
