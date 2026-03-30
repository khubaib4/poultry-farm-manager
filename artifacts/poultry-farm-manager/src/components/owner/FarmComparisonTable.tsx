import React, { useState } from "react";
import { ArrowUpDown, Download } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { FarmComparisonData } from "@/types/electron";

interface FarmComparisonTableProps {
  data: FarmComparisonData[];
  onExport?: () => void;
}

type SortKey = keyof FarmComparisonData;

export default function FarmComparisonTable({ data, onExport }: FarmComparisonTableProps): React.ReactElement {
  const [sortKey, setSortKey] = useState<SortKey>("farmName");
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string" && typeof bv === "string") return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av;
    return 0;
  });

  const th = (label: string, key: SortKey) => (
    <th
      className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-700 select-none"
      onClick={() => handleSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === key ? "text-blue-600" : "text-slate-300"}`} />
      </div>
    </th>
  );

  const statusColor = (val: number, thresholds: [number, number]) =>
    val >= thresholds[1] ? "text-green-600" : val >= thresholds[0] ? "text-amber-600" : "text-red-600";

  return (
    <div className="bg-white rounded-xl border">
      <div className="flex items-center justify-between p-5 border-b">
        <h3 className="text-lg font-semibold text-slate-900">Detailed Comparison</h3>
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {th("Farm", "farmName")}
              {th("Birds", "totalBirds")}
              {th("Eggs/Day", "avgEggsPerDay")}
              {th("Production", "productionRate")}
              {th("Mortality", "mortalityRate")}
              {th("Revenue", "revenue")}
              {th("Expenses", "expenses")}
              {th("Profit", "profit")}
              {th("Margin", "profitMargin")}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((farm) => (
              <tr key={farm.farmId} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{farm.farmName}</td>
                <td className="px-3 py-3 text-sm text-slate-700">{farm.totalBirds.toLocaleString()}</td>
                <td className="px-3 py-3 text-sm text-slate-700">{farm.avgEggsPerDay.toLocaleString()}</td>
                <td className={`px-3 py-3 text-sm font-medium ${statusColor(farm.productionRate, [70, 85])}`}>{farm.productionRate}%</td>
                <td className={`px-3 py-3 text-sm font-medium ${farm.mortalityRate <= 0.5 ? "text-green-600" : farm.mortalityRate <= 1 ? "text-amber-600" : "text-red-600"}`}>{farm.mortalityRate}%</td>
                <td className="px-3 py-3 text-sm text-gray-700">{formatCurrency(farm.revenue)}</td>
                <td className="px-3 py-3 text-sm text-gray-700">{formatCurrency(farm.expenses)}</td>
                <td className={`px-3 py-3 text-sm font-medium ${farm.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(farm.profit)}</td>
                <td className={`px-3 py-3 text-sm font-medium ${statusColor(farm.profitMargin, [10, 20])}`}>{farm.profitMargin}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
