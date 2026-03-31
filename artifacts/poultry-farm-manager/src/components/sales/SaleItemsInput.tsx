import React from "react";
import { formatCurrency } from "@/lib/utils";

export interface SaleItemRow {
  itemType: "egg" | "tray";
  grade: "A" | "B" | "cracked";
  quantity: string;
  unitPrice: string;
}

interface SaleItemsInputProps {
  items: SaleItemRow[];
  onChange: (items: SaleItemRow[]) => void;
}

const GRADE_LABELS: Record<string, string> = {
  A: "Grade A",
  B: "Grade B",
  cracked: "Cracked",
};

export default function SaleItemsInput({ items, onChange }: SaleItemsInputProps): React.ReactElement {
  const hasEggs = items.some(i => i.itemType === "egg");
  const hasTrays = items.some(i => i.itemType === "tray");

  function toggleItemType(type: "egg" | "tray") {
    if (type === "egg") {
      if (hasEggs) {
        onChange(items.filter(i => i.itemType !== "egg"));
      } else {
        onChange([
          ...items,
          { itemType: "egg", grade: "A", quantity: "", unitPrice: "" },
          { itemType: "egg", grade: "B", quantity: "", unitPrice: "" },
          { itemType: "egg", grade: "cracked", quantity: "", unitPrice: "" },
        ]);
      }
    } else {
      if (hasTrays) {
        onChange(items.filter(i => i.itemType !== "tray"));
      } else {
        onChange([
          ...items,
          { itemType: "tray", grade: "A", quantity: "", unitPrice: "" },
          { itemType: "tray", grade: "B", quantity: "", unitPrice: "" },
          { itemType: "tray", grade: "cracked", quantity: "", unitPrice: "" },
        ]);
      }
    }
  }

  function updateItem(index: number, field: "quantity" | "unitPrice", value: string) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function getLineTotal(item: SaleItemRow): number {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return Math.round(qty * price * 100) / 100;
  }

  const eggItems = items.filter(i => i.itemType === "egg");
  const trayItems = items.filter(i => i.itemType === "tray");

  function renderItemGroup(groupItems: SaleItemRow[], type: string, label: string) {
    if (groupItems.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{label}</h4>
        <div className="space-y-2">
          {groupItems.map((item) => {
            const globalIndex = items.indexOf(item);
            const lineTotal = getLineTotal(item);
            return (
              <div key={`${type}-${item.grade}`} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-3">
                  <span className="text-sm text-gray-600">{GRADE_LABELS[item.grade]}</span>
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(globalIndex, "quantity", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={type === "egg" ? "Price/egg" : "Price/tray"}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(globalIndex, "unitPrice", e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="block text-sm font-medium text-gray-700">Items</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleItemType("egg")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              hasEggs
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Eggs
          </button>
          <button
            type="button"
            onClick={() => toggleItemType("tray")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              hasTrays
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
            }`}
          >
            Trays
          </button>
        </div>
      </div>

      {!hasEggs && !hasTrays && (
        <p className="text-sm text-gray-400 italic">Select Eggs, Trays, or both to add items.</p>
      )}

      <div className="space-y-4">
        {hasEggs && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-3">Grade</div>
              <div className="col-span-3">Quantity</div>
              <div className="col-span-3">Price/Egg</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
            {renderItemGroup(eggItems, "egg", "")}
          </div>
        )}
        {hasTrays && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-gray-500 uppercase">
              <div className="col-span-3">Grade</div>
              <div className="col-span-3">Quantity</div>
              <div className="col-span-3">Price/Tray</div>
              <div className="col-span-3 text-right">Total</div>
            </div>
            {renderItemGroup(trayItems, "tray", "")}
          </div>
        )}
      </div>
    </div>
  );
}
