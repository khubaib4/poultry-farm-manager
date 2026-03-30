import React from "react";
import { Pencil, Plus, Minus, Trash2, Package, Pill, Wrench } from "lucide-react";
import StockStatusBadge from "./StockStatusBadge";
import { formatDateForDisplay } from "@/lib/utils";
import type { InventoryItem } from "@/types/electron";

interface InventoryCardProps {
  item: InventoryItem;
  onEdit: (item: InventoryItem) => void;
  onAddStock: (item: InventoryItem) => void;
  onReduceStock: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  feed: <Package className="h-5 w-5 text-amber-600" />,
  medicine: <Pill className="h-5 w-5 text-blue-600" />,
  equipment: <Wrench className="h-5 w-5 text-gray-600" />,
};

export default function InventoryCard({ item, onEdit, onAddStock, onReduceStock, onDelete }: InventoryCardProps): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
            {TYPE_ICONS[item.itemType] ?? <Package className="h-5 w-5 text-gray-400" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{item.itemName}</p>
            <p className="text-xs text-gray-500 capitalize">{item.itemType}</p>
          </div>
        </div>
        <StockStatusBadge quantity={item.quantity} threshold={item.minThreshold} expiryDate={item.expiryDate} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-500">Quantity</p>
          <p className="text-sm font-bold text-gray-900">{item.quantity} <span className="text-xs font-normal text-gray-500">{item.unit}</span></p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5">
          <p className="text-xs text-gray-500">{item.expiryDate ? "Expiry" : "Threshold"}</p>
          <p className="text-sm font-medium text-gray-900">
            {item.expiryDate ? formatDateForDisplay(item.expiryDate) : item.minThreshold !== null ? `${item.minThreshold} ${item.unit}` : "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 border-t border-gray-100 pt-3">
        <button onClick={() => onAddStock(item)} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
        <button onClick={() => onReduceStock(item)} disabled={item.quantity <= 0} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors disabled:opacity-30">
          <Minus className="h-3.5 w-3.5" /> Use
        </button>
        <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
