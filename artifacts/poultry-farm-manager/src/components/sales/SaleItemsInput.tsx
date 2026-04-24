import React from "react";
import { formatCurrency } from "@/lib/utils";
import type { EggCategory } from "@/types/electron";

export interface SaleItemRow {
  category: string;
  unitType: "egg" | "tray" | "peti";
  quantity: string;
  unitPrice: string;
}

export interface CombinedSaleItemRow {
  category: string;
  petiQty: string;
  trayQty: string;
  pricePerPeti: string;
}

type SaleItemsInputProps =
  | {
      mode: "walkin";
      items: SaleItemRow[];
      onChange: (items: SaleItemRow[]) => void;
      categories?: EggCategory[];
    }
  | {
      mode: "existing";
      items: CombinedSaleItemRow[];
      onChange: (items: CombinedSaleItemRow[]) => void;
      categories?: EggCategory[];
    };

const UNIT_OPTIONS: Array<{ value: SaleItemRow["unitType"]; label: string; multiplier: number }> = [
  { value: "egg", label: "Eggs", multiplier: 1 },
  { value: "tray", label: "Tray (30 eggs)", multiplier: 30 },
  { value: "peti", label: "Peti (360 eggs)", multiplier: 360 },
];

export default function SaleItemsInput(props: SaleItemsInputProps): React.ReactElement {
  const { categories } = props;
  const { items, onChange } = props as any;
  const activeCategories = (categories ?? []).filter((c) => (c.isActive ?? 1) !== 0);

  const mode = props.mode;

  function getDefaultPetiPriceForCategory(catName: string): string {
    const cat = activeCategories.find((c) => c.name === catName) ?? activeCategories[0];
    const base = Number(cat?.defaultPrice ?? 0);
    if (!Number.isFinite(base) || base <= 0) return "";
    // EggCategory.defaultPrice is typically configured per tray in this app.
    // For combined layout we store price per peti (12 trays).
    const petiPrice = cat?.unit === "tray" ? base * 12 : base;
    return petiPrice > 0 ? String(petiPrice) : "";
  }

  function addRow() {
    const defaultCategory = activeCategories[0]?.name ?? "";
    if (mode === "existing") {
      const defaultPetiPrice = getDefaultPetiPriceForCategory(defaultCategory);
      (onChange as (items: CombinedSaleItemRow[]) => void)([
        ...(items as CombinedSaleItemRow[]),
        { category: defaultCategory, petiQty: "", trayQty: "", pricePerPeti: defaultPetiPrice },
      ]);
      return;
    }
    const defaultPrice = Number(activeCategories[0]?.defaultPrice ?? 0);
    (onChange as (items: SaleItemRow[]) => void)([
      ...(items as SaleItemRow[]),
      {
        category: defaultCategory,
        unitType: "tray",
        quantity: "",
        unitPrice: defaultPrice > 0 ? String(defaultPrice) : "",
      },
    ]);
  }

  function removeRow(index: number) {
    if (mode === "existing") {
      const updated = (items as CombinedSaleItemRow[]).filter((_, i) => i !== index);
      const fallbackCategory = activeCategories[0]?.name ?? "";
      const fallbackPetiPrice = getDefaultPetiPriceForCategory(fallbackCategory);
      (onChange as (items: CombinedSaleItemRow[]) => void)(
        updated.length > 0 ? updated : [{ category: fallbackCategory, petiQty: "", trayQty: "", pricePerPeti: fallbackPetiPrice }]
      );
      return;
    }

    const updated = (items as SaleItemRow[]).filter((_, i) => i !== index);
    const fallbackCategory = activeCategories[0]?.name ?? "";
    const fallbackPrice = Number(activeCategories[0]?.defaultPrice ?? 0);
    (onChange as (items: SaleItemRow[]) => void)(
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

  function updateWalkInItem(index: number, patch: Partial<SaleItemRow>) {
    const updated = [...(items as SaleItemRow[])];
    updated[index] = { ...updated[index], ...patch };
    (onChange as (items: SaleItemRow[]) => void)(updated);
  }

  function updateExistingItem(index: number, patch: Partial<CombinedSaleItemRow>) {
    const updated = [...(items as CombinedSaleItemRow[])];
    updated[index] = { ...updated[index], ...patch };
    (onChange as (items: CombinedSaleItemRow[]) => void)(updated);
  }

  function getLineTotalWalkIn(item: SaleItemRow): number {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return Math.round(qty * price * 100) / 100;
  }

  function getTotalEggsWalkIn(item: SaleItemRow): number {
    const qty = parseFloat(item.quantity) || 0;
    const mult = UNIT_OPTIONS.find((u) => u.value === item.unitType)?.multiplier ?? 1;
    return Math.max(0, Math.trunc(qty * mult));
  }

  function getExistingComputed(row: CombinedSaleItemRow): {
    petiQty: number;
    trayQty: number;
    pricePerPeti: number;
    trayPrice: number;
    totalEggs: number;
    lineTotal: number;
  } {
    const petiQty = Math.max(0, Math.trunc(parseFloat(row.petiQty) || 0));
    const trayQty = Math.max(0, Math.trunc(parseFloat(row.trayQty) || 0));
    const pricePerPeti = Math.max(0, parseFloat(row.pricePerPeti) || 0);
    const trayPrice = pricePerPeti > 0 ? pricePerPeti / 12 : 0;
    const totalEggs = Math.max(0, Math.trunc(petiQty * 360 + trayQty * 30));
    const lineTotal = Math.round((petiQty * pricePerPeti + trayQty * trayPrice) * 100) / 100;
    return { petiQty, trayQty, pricePerPeti, trayPrice, totalEggs, lineTotal };
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
        {mode === "existing" ? (
          <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
            <span>Category</span>
            <span>Peti</span>
            <span>Tray</span>
            <span>Price/Peti</span>
            <span className="text-right">Total</span>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2 text-xs font-medium text-gray-500 uppercase mb-2">
            <span>Category</span>
            <span>Unit</span>
            <span>Qty</span>
            <span>Price</span>
            <span className="text-right">Total</span>
            <span />
          </div>
        )}

        <div className="space-y-2">
          {(items as any[]).map((item, index) => {
            if (mode === "existing") {
              const row = item as CombinedSaleItemRow;
              const { totalEggs, lineTotal, trayPrice } = getExistingComputed(row);

              return (
                <div key={`${index}-${row.category}`} className="space-y-1">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                    {activeCategories.length > 0 ? (
                      <select
                        value={row.category}
                        onChange={(e) => {
                          const nextName = e.target.value;
                          updateExistingItem(index, {
                            category: nextName,
                            pricePerPeti: row.pricePerPeti ? row.pricePerPeti : getDefaultPetiPriceForCategory(nextName),
                          });
                        }}
                        className="px-2 py-2 border rounded-lg text-sm bg-white"
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
                        value={row.category}
                        onChange={(e) => updateExistingItem(index, { category: e.target.value })}
                        placeholder="Category name"
                        className="px-2 py-2 border rounded-lg text-sm"
                      />
                    )}

                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={row.petiQty}
                      onChange={(e) => updateExistingItem(index, { petiQty: e.target.value })}
                      className="px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none md:max-w-[90px]"
                    />

                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={row.trayQty}
                      onChange={(e) => updateExistingItem(index, { trayQty: e.target.value })}
                      className="px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none md:max-w-[90px]"
                    />

                    <div className="space-y-1">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Enter peti rate"
                        value={row.pricePerPeti}
                        onChange={(e) => updateExistingItem(index, { pricePerPeti: e.target.value })}
                        className="w-full px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                      />
                      <div className="text-[11px] text-gray-500">
                        Tray: {trayPrice > 0 ? `PKR ${trayPrice.toFixed(2)}` : "—"}
                      </div>
                    </div>

                    <div className="text-right font-medium">
                      {lineTotal > 0 ? formatCurrency(lineTotal) : "—"}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 ml-2">
                    <span>= {totalEggs.toLocaleString()} eggs</span>
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-gray-400 hover:text-red-600"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            }

            const row = item as SaleItemRow;
            const totalEggs = getTotalEggsWalkIn(row);
            const lineTotal = getLineTotalWalkIn(row);

            return (
              <div key={`${index}-${row.category}-${row.unitType}`} className="space-y-1">
                <div className="grid grid-cols-6 gap-2 items-center">
                  {activeCategories.length > 0 ? (
                    <select
                      value={row.category}
                      onChange={(e) => {
                        const nextName = e.target.value;
                        const nextCat = activeCategories.find((c) => c.name === nextName);
                        updateWalkInItem(index, {
                          category: nextName,
                          unitPrice: row.unitPrice ? row.unitPrice : String(nextCat?.defaultPrice ?? ""),
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
                      value={row.category}
                      onChange={(e) => updateWalkInItem(index, { category: e.target.value })}
                      placeholder="Category name"
                      className="col-span-1 px-2 py-2 border rounded-lg text-sm"
                    />
                  )}

                  <select
                    value={row.unitType}
                    onChange={(e) => updateWalkInItem(index, { unitType: e.target.value as SaleItemRow["unitType"] })}
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
                    value={row.quantity}
                    onChange={(e) => updateWalkInItem(index, { quantity: e.target.value })}
                    className="col-span-1 px-2 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={`Price/${row.unitType}`}
                    value={row.unitPrice}
                    onChange={(e) => updateWalkInItem(index, { unitPrice: e.target.value })}
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

                <div className="text-xs text-gray-500 ml-2">= {totalEggs.toLocaleString()} eggs</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
