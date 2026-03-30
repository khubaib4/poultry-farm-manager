import React from "react";
import { Pencil, Plus, Minus, Trash2 } from "lucide-react";
import StockStatusBadge from "./StockStatusBadge";
import { formatDateForDisplay } from "@/lib/utils";
import type { InventoryItem } from "@/types/electron";

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onAddStock: (item: InventoryItem) => void;
  onReduceStock: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

const TYPE_LABELS: Record<string, string> = {
  feed: "Feed",
  medicine: "Medicine",
  equipment: "Equipment",
};

export default function InventoryTable({ items, onEdit, onAddStock, onReduceStock, onDelete }: InventoryTableProps): React.ReactElement {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-lg mb-1">No inventory items</p>
        <p className="text-gray-400 text-sm">Add items to start tracking your stock.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Expiry</th>
              <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 uppercase">Last Updated</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                  {item.minThreshold !== null && (
                    <p className="text-xs text-gray-400">Min: {item.minThreshold} {item.unit}</p>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span className="text-sm text-gray-600">{TYPE_LABELS[item.itemType] ?? item.itemType}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-semibold text-gray-900">{item.quantity}</span>
                  <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <StockStatusBadge quantity={item.quantity} threshold={item.minThreshold} expiryDate={item.expiryDate} />
                </td>
                <td className="px-3 py-3 text-sm text-gray-600">
                  {item.expiryDate ? formatDateForDisplay(item.expiryDate) : "—"}
                </td>
                <td className="px-3 py-3 text-sm text-gray-500">
                  {item.lastUpdated ? formatDateForDisplay(item.lastUpdated.split("T")[0]) : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onAddStock(item)} title="Add Stock"
                      className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button onClick={() => onReduceStock(item)} title="Reduce Stock" disabled={item.quantity <= 0}
                      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-30">
                      <Minus className="h-4 w-4" />
                    </button>
                    <button onClick={() => onEdit(item)} title="Edit"
                      className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(item)} title="Delete"
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
