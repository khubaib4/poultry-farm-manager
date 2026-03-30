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
        <p className="text-gray-400 text-sm">Record daily entries and set egg prices to see revenue.</p>
      </div>
    );
  }

  const grandTotal = data.reduce((s, d) => s + d.total, 0);
  const totalA = data.reduce((s, d) => s + d.gradeA.qty, 0);
  const totalB = data.reduce((s, d) => s + d.gradeB.qty, 0);
  const totalC = data.reduce((s, d) => s + d.cracked.qty, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase" colSpan={2}>Grade A</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase" colSpan={2}>Grade B</th>
              <th className="text-center px-3 py-3 text-xs font-medium text-gray-500 uppercase" colSpan={2}>Cracked</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
            </tr>
            <tr className="border-b border-gray-100 bg-gray-50/30">
              <th className="px-4 py-1" />
              <th className="text-center px-2 py-1 text-xs text-gray-400">Qty</th>
              <th className="text-right px-2 py-1 text-xs text-gray-400">Revenue</th>
              <th className="text-center px-2 py-1 text-xs text-gray-400">Qty</th>
              <th className="text-right px-2 py-1 text-xs text-gray-400">Revenue</th>
              <th className="text-center px-2 py-1 text-xs text-gray-400">Qty</th>
              <th className="text-right px-2 py-1 text-xs text-gray-400">Revenue</th>
              <th className="px-4 py-1" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map(row => (
              <tr key={row.date} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">{formatDateForDisplay(row.date)}</td>
                <td className="px-2 py-2.5 text-sm text-gray-600 text-center">{row.gradeA.qty.toLocaleString()}</td>
                <td className="px-2 py-2.5 text-sm text-green-700 text-right">{formatCurrency(row.gradeA.revenue)}</td>
                <td className="px-2 py-2.5 text-sm text-gray-600 text-center">{row.gradeB.qty.toLocaleString()}</td>
                <td className="px-2 py-2.5 text-sm text-blue-700 text-right">{formatCurrency(row.gradeB.revenue)}</td>
                <td className="px-2 py-2.5 text-sm text-gray-600 text-center">{row.cracked.qty.toLocaleString()}</td>
                <td className="px-2 py-2.5 text-sm text-amber-700 text-right">{formatCurrency(row.cracked.revenue)}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-gray-900 text-right">{formatCurrency(row.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
              <td className="px-2 py-3 text-sm font-medium text-gray-700 text-center">{totalA.toLocaleString()}</td>
              <td className="px-2 py-3 text-sm font-medium text-green-700 text-right">{formatCurrency(data.reduce((s, d) => s + d.gradeA.revenue, 0))}</td>
              <td className="px-2 py-3 text-sm font-medium text-gray-700 text-center">{totalB.toLocaleString()}</td>
              <td className="px-2 py-3 text-sm font-medium text-blue-700 text-right">{formatCurrency(data.reduce((s, d) => s + d.gradeB.revenue, 0))}</td>
              <td className="px-2 py-3 text-sm font-medium text-gray-700 text-center">{totalC.toLocaleString()}</td>
              <td className="px-2 py-3 text-sm font-medium text-amber-700 text-right">{formatCurrency(data.reduce((s, d) => s + d.cracked.revenue, 0))}</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{formatCurrency(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
