import React from "react";
import { formatCurrency } from "@/lib/utils";
import { getCategoryConfig, EXPENSE_CATEGORIES } from "./CategoryIcon";

interface ExpenseSummaryCardProps {
  total: number;
  byCategory: Record<string, number>;
  count: number;
}

export default function ExpenseSummaryCard({ total, byCategory, count }: ExpenseSummaryCardProps): React.ReactElement {
  const sortedCategories = EXPENSE_CATEGORIES
    .filter(c => (byCategory[c.value] || 0) > 0)
    .sort((a, b) => (byCategory[b.value] || 0) - (byCategory[a.value] || 0));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Entries</p>
          <p className="text-lg font-semibold text-gray-700">{count}</p>
        </div>
      </div>

      {sortedCategories.length > 0 && (
        <div className="space-y-2">
          {sortedCategories.map(cat => {
            const amount = byCategory[cat.value] || 0;
            const pct = total > 0 ? (amount / total) * 100 : 0;
            const config = getCategoryConfig(cat.value);
            return (
              <div key={cat.value} className="flex items-center gap-3">
                <div className={`h-6 w-6 rounded flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                  {React.cloneElement(config.icon as React.ReactElement, { className: "h-3.5 w-3.5" })}
                </div>
                <span className="text-sm text-gray-600 w-32 truncate">{cat.label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${config.bg.replace("50", "400")}`}
                    style={{ width: `${pct}%`, backgroundColor: getBarColor(cat.value) }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-28 text-right">{formatCurrency(amount)}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      )}

      {sortedCategories.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">No expenses in this period</p>
      )}
    </div>
  );
}

function getBarColor(category: string): string {
  const colors: Record<string, string> = {
    feed: "#d97706",
    medicine: "#dc2626",
    labor: "#2563eb",
    utilities: "#ca8a04",
    equipment: "#9333ea",
    misc: "#6b7280",
  };
  return colors[category] || "#6b7280";
}
