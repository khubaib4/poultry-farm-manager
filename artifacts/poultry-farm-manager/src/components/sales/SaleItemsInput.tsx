import React from "react";
import { formatCurrency } from "@/lib/utils";
import type { EggCategory } from "@/types/electron";

export interface SaleItemRow {
  category: string;
  unitType: "egg" | "tray" | "peti";
  quantity: string;
  unitPrice: string;
}

interface SaleItemsInputProps {
  items: SaleItemRow[];
  onChange: (items: SaleItemRow[]) => void;
  categories?: EggCategory[];
}

const UNIT_OPTIONS: Array<{ value: SaleItemRow["unitType"]; label: string; multiplier: number }> = [
  { value: "egg", label: "Eggs", multiplier: 1 },
  { value: "tray", label: "Tray (30 eggs)", multiplier: 30 },
  { value: "peti", label: "Peti (360 eggs)", multiplier: 360 },
];

export default function SaleItemsInput({ items, onChange, categories }: SaleItemsInputProps): React.ReactElement {
  const activeCategories = (categories ?? []).filter((c) => (c.isActive ?? 1) !== 0);

  function updateItem(index: number, patch: Partial<SaleItemRow>) {
    const updated = [...items];
    updated[index] = { ...updated[index], ...patch };
    onChange(updated);
  }

  function getLineTotal(item: SaleItemRow): number {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return Math.round(qty * price * 100) / 100;
  }

  function getTotalEggs(item: SaleItemRow): number {
    const qty = parseFloat(item.quantity) || 0;
    const mult = UNIT_OPTIONS.find((u) => u.value === item.unitType)?.multiplier ?? 1;
    return Math.max(0, Math.trunc(qty * mult));
  }

  function addRow() {
    const defaultCategory = activeCategories[0]?.name ?? "";
    const defaultPrice = Number(activeCategories[0]?.defaultPrice ?? 0);
    onChange([
      ...items,
      {
        category: defaultCategory,
        unitType: "tray",
        quantity: "",
        unitPrice: defaultPrice > 0 ? String(defaultPrice) : "",
      },
    ]);
  }

  function removeRow(index: number) {
    const updated = items.filter((_, i) => i !== index);
    const fallbackCategory = activeCategories[0]?.name ?? "";
    const fallbackPrice = Number(activeCategories[0]?.defaultPrice ?? 0);
    onChange(
      updated.length > 0
        ? updated
        : [
            {
              category: fallbackCategory,
              unitType: "tray",
              quantity: "",
              unitPrice: fallbackPrice > 0 ? String(fallbackPrice) : "",
            },
          ]
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="block text-sm font-medium text-gray-700">Items</label>
        <button
          type="button"
          onClick={addRow}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          + Add item
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <div className="grid grid-cols-6 gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
          <span>Category</span>
          <span>Unit</span>
          <span>Qty</span>
          <span>Price</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        <div className="space-y-2">
          {items.map((item, index) => {
            const totalEggs = getTotalEggs(item);
            const lineTotal = getLineTotal(item);

            return (
              <div key={`${index}-${item.category}-${item.unitType}`} className="space-y-1">
                <div className="grid grid-cols-6 gap-2 items-center">
                  {activeCategories.length > 0 ? (
                    <select
                      value={item.category}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        const nextCat = activeCategories.find((c) => c.name === nextName);
                        updateItem(index, {
                          category: nextName,
                          unitPrice: item.unitPrice ? item.unitPrice : String(nextCat?.defaultPrice ?? ""),
                        });
                      }}
                      className="col-span-1 px-2 py-2 border rounded-lg text-sm bg-white"
                    >
                      {activeCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => updateItem(index, { category: e.target.value })}
                      placeholder="Category name"
                      className="col-span-1 px-2 py-2 border rounded-lg text-sm"
                    />
                  )}

                  <select
                    value={item.unitType}
                    onChange={(e) => updateItem(index, { unitType: e.target.value as SaleItemRow["unitType"] })}
                    className="col-span-1 px-2 py-2 border rounded-lg text-sm bg-white"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.value === "egg" ? "Eggs" : u.value === "tray" ? "Tray" : "Peti"}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, { quantity: e.target.value })}
                    className="col-span-1 px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={`Price/${item.unitType}`}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                    className="col-span-1 px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />

                  <div className="col-span-1 text-right font-medium">
                    {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="col-span-1 text-gray-400 hover:text-red-600 flex justify-center"
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs text-gray-500 ml-2">
                  = {totalEggs.toLocaleString()} eggs
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
