import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isElectron, inventory as inventoryApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const UNITS = ["bags", "kg", "pieces", "doses", "liters", "boxes"];

const TYPE_LABELS: Record<string, string> = {
  feed: "Feed",
  medicine: "Medicine",
  equipment: "Equipment",
};

export default function EditInventoryItemPage(): React.ReactElement {
  const navigate = useNavigate();
  const { itemId } = useParams<{ itemId: string }>();
  const id = itemId ? parseInt(itemId, 10) : null;

  const [itemName, setItemName] = useState("");
  const [unit, setUnit] = useState("bags");
  const [minThreshold, setMinThreshold] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [itemType, setItemType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const item = await inventoryApi.getById(id);
        setItemName(item.itemName);
        setUnit(item.unit);
        setMinThreshold(item.minThreshold !== null ? String(item.minThreshold) : "");
        setExpiryDate(item.expiryDate ?? "");
        setItemType(item.itemType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load item");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    if (itemName.trim().length < 2) { setError("Item name must be at least 2 characters"); return; }
    if (itemName.trim().length > 100) { setError("Item name must be 100 characters or less"); return; }
    const thresh = minThreshold ? parseFloat(minThreshold) : null;
    if (thresh !== null && (isNaN(thresh) || thresh < 0)) { setError("Threshold must be a non-negative number"); return; }

    setSaving(true);
    setError("");
    try {
      await inventoryApi.update(id, {
        itemName: itemName.trim(),
        unit,
        minThreshold: thresh,
        expiryDate: expiryDate || null,
      });
      navigate("/farm/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
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

  if (loading) {
    return (
      <div className="p-6 text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading item...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Edit Inventory Item</h1>
          <p className="text-sm text-gray-500 mt-0.5">Update item details (type cannot be changed)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
            {TYPE_LABELS[itemType] ?? itemType}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
          <input type="text" value={itemName} onChange={e => setItemName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
          <select value={unit} onChange={e => setUnit(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500">
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Threshold (for low stock alerts)</label>
          <input type="number" step="any" min="0" value={minThreshold} onChange={e => setMinThreshold(e.target.value)}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
        </div>

        {itemType === "medicine" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={() => navigate("/farm/inventory")}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving}
            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
