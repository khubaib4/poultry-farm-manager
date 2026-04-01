import React from "react";
import { formatCurrency, formatDateForDisplay } from "@/lib/utils";
import type { DailyRevenueEntry } from "@/types/electron";

interface DailyRevenueTableProps {
  data: DailyRevenueEntry[];
}

export default function DailyRevenueTable({ data }: DailyRevenueTableProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-lg mb-1">No revenue data</p>
        <p className="text-gray-400 text-sm">Create sales to see revenue here.</p>
      </div>
    );
  }

  const grandTotalAmount = data.reduce((s, d) => s + d.totalAmount, 0);
  const grandCollected = data.reduce((s, d) => s + d.collectedAmount, 0);
  const grandOutstanding = data.reduce((s, d) => s + d.outstanding, 0);
  const grandSales = data.reduce((s, d) => s + d.salesCount, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase">Sales</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="text-right px-3 py-3 text-xs font-medium text-gray-500 uppercase">Collected</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(row => (
              <tr key={row.date} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">{formatDateForDisplay(row.date)}</td>
                <td className="px-3 py-2.5 text-sm text-gray-600 text-center">{row.salesCount}</td>
                <td className="px-3 py-2.5 text-sm font-medium text-gray-900 text-right">{formatCurrency(row.totalAmount)}</td>
                <td className="px-3 py-2.5 text-sm text-green-700 text-right">{formatCurrency(row.collectedAmount)}</td>
                <td className="px-4 py-2.5 text-sm text-amber-700 text-right">{formatCurrency(row.outstanding)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
              <td className="px-3 py-3 text-sm font-medium text-gray-700 text-center">{grandSales}</td>
              <td className="px-3 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(grandTotalAmount)}</td>
              <td className="px-3 py-3 text-sm font-medium text-green-700 text-right">{formatCurrency(grandCollected)}</td>
              <td className="px-4 py-3 text-sm font-medium text-amber-700 text-right">{formatCurrency(grandOutstanding)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
