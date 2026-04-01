import React from "react";
import { formatCurrency } from "@/lib/utils";
import type { ProfitLossData } from "@/types/electron";

const CATEGORY_LABELS: Record<string, string> = {
  feed: "Feed Costs",
  medicine: "Medicine/Vaccines",
  labor: "Labor/Salaries",
  utilities: "Utilities",
  equipment: "Equipment/Maintenance",
  misc: "Miscellaneous",
};

interface PLStatementProps {
  data: ProfitLossData;
  periodLabel: string;
}

export default function PLStatement({ data, periodLabel }: PLStatementProps): React.ReactElement {
  const isProfit = data.profit >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 print:border-0 print:shadow-none" id="pl-statement">
      <div className="p-6 border-b border-gray-200 print:border-gray-400">
        <h2 className="text-lg font-bold text-gray-900 text-center">Profit & Loss Statement</h2>
        <p className="text-sm text-gray-500 text-center mt-1">{periodLabel}</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b-2 border-gray-900 pb-1">
            Revenue
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 pl-4">Sales Revenue ({data.revenue.salesCount} sales)</span>
              <span className="text-gray-900 font-medium">{formatCurrency(data.revenue.total)}</span>
            </div>
            {data.revenue.byProduct.length > 0 && (
              <div className="pl-8 space-y-1 border-l-2 border-gray-100 ml-4">
                {data.revenue.byProduct.map(p => (
                  <div key={p.name} className="flex items-center justify-between text-xs text-gray-500">
                    <span>{p.name}</span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold border-t border-gray-300 pt-2 mt-2">
              <span className="text-gray-900">Total Revenue</span>
              <span className="text-green-700">{formatCurrency(data.revenue.total)}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b-2 border-gray-900 pb-1">
            Expenses
          </h3>
          <div className="space-y-2">
            {(["feed", "medicine", "labor", "utilities", "equipment", "misc"] as const).map(cat => {
              const amount = data.expenses.byCategory[cat] ?? 0;
              return (
                <div key={cat} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 pl-4">{CATEGORY_LABELS[cat]}</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(amount)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between text-sm font-bold border-t border-gray-300 pt-2 mt-2">
              <span className="text-gray-900">Total Expenses</span>
              <span className="text-red-700">{formatCurrency(data.expenses.total)}</span>
            </div>
          </div>
        </div>

        <div className="border-t-2 border-double border-gray-900 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-gray-900">Gross {isProfit ? "Profit" : "Loss"}</span>
            <span className={`text-lg font-bold ${isProfit ? "text-green-700" : "text-red-700"}`}>
              {isProfit ? "+" : "-"}{formatCurrency(Math.abs(data.profit))}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-500">Profit Margin</span>
            <span className={`text-sm font-semibold ${isProfit ? "text-green-600" : "text-red-600"}`}>
              {data.margin.toFixed(1)}%
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 border-b-2 border-gray-900 pb-1">
            Collections
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 pl-4">Total Billed</span>
              <span className="text-gray-900 font-medium">{formatCurrency(data.revenue.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 pl-4">Total Collected</span>
              <span className="text-green-700 font-medium">{formatCurrency(data.revenue.totalCollected)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 pl-4">Outstanding</span>
              <span className={`font-medium ${data.revenue.outstanding > 0 ? "text-amber-600" : "text-green-700"}`}>
                {formatCurrency(data.revenue.outstanding)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold border-t border-gray-300 pt-2 mt-2">
              <span className="text-gray-900">Collection Rate</span>
              <span className={`${data.revenue.collectionRate >= 80 ? "text-green-700" : data.revenue.collectionRate >= 50 ? "text-amber-600" : "text-red-700"}`}>
                {data.revenue.collectionRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
