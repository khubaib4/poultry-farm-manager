import React from "react";
import { DollarSign, ShoppingCart, CreditCard, AlertTriangle, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import SalesTrendChart from "./SalesTrendChart";
import PaymentMethodBreakdown from "./PaymentMethodBreakdown";
import SalesByGradeChart from "./SalesByGradeChart";
import type { SalesSummaryReport as SalesSummaryData, SalesTrendPoint, GradeBreakdownReport } from "@/types/electron";

interface Props {
  data: SalesSummaryData;
  trendData: SalesTrendPoint[];
  gradeData: GradeBreakdownReport[];
  period: string;
}

export default function SalesSummaryReport({ data, trendData, gradeData, period }: Props): React.ReactElement {
  const { totals, dailyBreakdown, paymentMethods } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Sales Count</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{totals.salesCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Total Sales</span>
          </div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totals.totalAmount)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Collected</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalCollected)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Outstanding</span>
          </div>
          <p className="text-xl font-bold text-red-600">{formatCurrency(totals.totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-gray-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Avg Sale</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totals.averageSaleValue)}</p>
        </div>
      </div>

      <SalesTrendChart data={trendData} period={period} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PaymentMethodBreakdown data={paymentMethods} />
        <SalesByGradeChart data={gradeData} />
      </div>

      {dailyBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium text-right">Sales</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Collected</th>
                </tr>
              </thead>
              <tbody>
                {dailyBreakdown.map(d => (
                  <tr key={d.date} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-900">{d.date}</td>
                    <td className="py-2.5 text-right text-gray-700">{d.salesCount}</td>
                    <td className="py-2.5 text-right text-gray-900 font-medium">{formatCurrency(d.amount)}</td>
                    <td className="py-2.5 text-right text-green-700">{formatCurrency(d.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
