import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, inventory as inventoryApi } from "@/lib/api";
import { Plus, Package, Pill, AlertTriangle, Clock, Search } from "lucide-react";
import InventoryTable from "@/components/inventory/InventoryTable";
import InventoryCard from "@/components/inventory/InventoryCard";
import AddStockModal from "@/components/inventory/AddStockModal";
import ReduceStockModal from "@/components/inventory/ReduceStockModal";
import { getStockStatus } from "@/components/inventory/StockStatusBadge";
import type { InventoryItem } from "@/types/electron";

type TabType = "all" | "feed" | "medicine" | "equipment";

export default function InventoryPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = user?.farmId ?? null;

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [tab, setTab] = useState<TabType>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addStockItem, setAddStockItem] = useState<InventoryItem | null>(null);
  const [reduceStockItem, setReduceStockItem] = useState<InventoryItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<InventoryItem | null>(null);

  const fetchItems = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const data = await inventoryApi.getByFarm(farmId, tab === "all" ? undefined : tab);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [farmId, tab]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const filteredItems = search
    ? items.filter(i => i.itemName.toLowerCase().includes(search.toLowerCase()))
    : items;

  const totalFeed = items.filter(i => i.itemType === "feed").reduce((s, i) => s + i.quantity, 0);
  const medicineCount = items.filter(i => i.itemType === "medicine").length;
  const lowStockCount = items.filter(i => getStockStatus(i.quantity, i.minThreshold, i.expiryDate) === "low" || getStockStatus(i.quantity, i.minThreshold, i.expiryDate) === "out").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  const cutoff = thirtyDaysLater.toISOString().split("T")[0];
  const expiringCount = items.filter(i => i.expiryDate && i.expiryDate <= cutoff && i.expiryDate > todayStr).length;

  async function handleAddStock(data: { quantity: number; date: string; supplier?: string; cost?: number; expiryDate?: string; notes?: string }) {
    if (!addStockItem) return;
    await inventoryApi.addStock(addStockItem.id, data);
    fetchItems();
  }

  async function handleReduceStock(data: { quantity: number; date: string; reason: string; notes?: string }) {
    if (!reduceStockItem) return;
    await inventoryApi.reduceStock(reduceStockItem.id, data);
    fetchItems();
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await inventoryApi.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    fetchItems();
  }

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Inventory management is only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track feed, medicine, and equipment stock levels</p>
        </div>
        <button
          onClick={() => navigate("/farm/inventory/new")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-gray-500">Feed Stock</span>
          </div>
          <p className="text-lg font-bold text-amber-700">{totalFeed.toLocaleString()} <span className="text-xs font-normal">units</span></p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-gray-500">Medicine Items</span>
          </div>
          <p className="text-lg font-bold text-blue-700">{medicineCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs text-gray-500">Low Stock</span>
          </div>
          <p className="text-lg font-bold text-red-700">{lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-xs text-gray-500">Expiring Soon</span>
          </div>
          <p className="text-lg font-bold text-orange-700">{expiringCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {(["all", "feed", "medicine", "equipment"] as TabType[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${tab === t ? "bg-green-100 text-green-700 font-medium" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {t === "all" ? "All" : t}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 w-56"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading inventory...</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <InventoryTable
              items={filteredItems}
              onEdit={item => navigate(`/farm/inventory/${item.id}/edit`)}
              onAddStock={setAddStockItem}
              onReduceStock={setReduceStockItem}
              onDelete={setDeleteConfirm}
            />
          </div>
          <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-400 text-lg mb-1">No inventory items</p>
                <p className="text-gray-400 text-sm">Add items to start tracking your stock.</p>
              </div>
            ) : (
              filteredItems.map(item => (
                <InventoryCard
                  key={item.id}
                  item={item}
                  onEdit={i => navigate(`/farm/inventory/${i.id}/edit`)}
                  onAddStock={setAddStockItem}
                  onReduceStock={setReduceStockItem}
                  onDelete={setDeleteConfirm}
                />
              ))
            )}
          </div>
        </>
      )}

      {addStockItem && (
        <AddStockModal item={addStockItem} onClose={() => setAddStockItem(null)} onSubmit={handleAddStock} />
      )}

      {reduceStockItem && (
        <ReduceStockModal item={reduceStockItem} onClose={() => setReduceStockItem(null)} onSubmit={handleReduceStock} />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-medium">{deleteConfirm.itemName}</span>? This will also remove all stock history.
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
