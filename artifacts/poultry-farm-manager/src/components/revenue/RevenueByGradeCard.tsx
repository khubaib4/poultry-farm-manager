import React from "react";
import { formatCurrency } from "@/lib/utils";

interface CustomerRevenue {
  customerId: number;
  customerName: string;
  totalAmount: number;
  collectedAmount: number;
}

interface TypeRevenue {
  itemType: string;
  grade: string;
  quantity: number;
  revenue: number;
}

interface RevenueBreakdownProps {
  byCustomer: CustomerRevenue[];
  byType: TypeRevenue[];
  totalRevenue: number;
}

function gradeLabel(itemType: string, grade: string): string {
  const prefix = itemType === "peti" ? "Peti" : itemType === "tray" ? "Tray" : "Egg";
  return `${prefix} - ${grade}`;
}

export default function RevenueBreakdownCard({ byCustomer, byType, totalRevenue }: RevenueBreakdownProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Customer</h3>
        {byCustomer.length === 0 ? (
          <p className="text-sm text-gray-400">No sales in this period</p>
        ) : (
          <div className="space-y-3">
            {byCustomer.slice(0, 8).map(c => {
              const pct = totalRevenue > 0 ? (c.totalAmount / totalRevenue) * 100 : 0;
              return (
                <div key={c.customerId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[60%]">{c.customerName}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(c.totalAmount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{pct.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Type</h3>
        {byType.length === 0 ? (
          <p className="text-sm text-gray-400">No sales in this period</p>
        ) : (
          <div className="space-y-3">
            {byType.map(t => {
              const pct = totalRevenue > 0 ? (t.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={`${t.itemType}:${t.grade}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{gradeLabel(t.itemType, t.grade)}</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(t.revenue)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-20 text-right">
                      {Number(t.quantity ?? 0).toLocaleString()}{" "}
                      {t.itemType === "peti" ? "peti" : t.itemType === "tray" ? "trays" : "eggs"} · {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total</span>
          <span className="text-sm font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
        </div>
      </div>
    </div>
  );
}
