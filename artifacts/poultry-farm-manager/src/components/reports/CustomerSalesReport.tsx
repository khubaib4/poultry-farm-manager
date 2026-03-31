import React from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, ShoppingCart, CreditCard, AlertTriangle } from "lucide-react";
import CategoryBadge from "@/components/customers/CategoryBadge";
import type { CustomerHistoryReport } from "@/types/electron";

interface Props {
  data: CustomerHistoryReport;
}

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  unpaid: "bg-red-100 text-red-700",
};

export default function CustomerSalesReport({ data }: Props): React.ReactElement {
  const { customer, totals, sales, payments } = data;

  const trendMap: Record<string, number> = {};
  for (const s of sales) {
    const month = s.saleDate.substring(0, 7);
    trendMap[month] = (trendMap[month] || 0) + s.totalAmount;
  }
  const trendData = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
            {customer.businessName && <p className="text-sm text-gray-500">{customer.businessName}</p>}
            {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
          </div>
          <CategoryBadge category={customer.category} size="md" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Orders</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{totals.salesCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Purchases</span>
          </div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(totals.totalPurchases)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Paid</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(totals.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-gray-500 uppercase">Balance</span>
          </div>
          <p className={`text-xl font-bold ${totals.balanceDue > 0 ? "text-red-600" : "text-gray-900"}`}>
            {formatCurrency(totals.balanceDue)}
          </p>
        </div>
      </div>

      {trendData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Purchase Trend</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="amount" stroke="#16a34a" fill="#dcfce7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {sales.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Purchase History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Paid</th>
                  <th className="pb-3 font-medium text-right">Balance</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-900">{s.invoiceNumber}</td>
                    <td className="py-2.5 text-gray-700">{s.saleDate}</td>
                    <td className="py-2.5 text-gray-500 text-xs">
                      {s.items.map(i => `${i.quantity} ${i.itemType} (${i.grade})`).join(", ")}
                    </td>
                    <td className="py-2.5 text-right font-medium text-gray-900">{formatCurrency(s.totalAmount)}</td>
                    <td className="py-2.5 text-right text-green-700">{formatCurrency(s.paidAmount)}</td>
                    <td className={`py-2.5 text-right ${s.balanceDue > 0 ? "text-red-600 font-medium" : "text-gray-500"}`}>
                      {formatCurrency(s.balanceDue)}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[s.paymentStatus] || "bg-gray-100 text-gray-700"}`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-200">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Invoice</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 text-gray-700">{p.paymentDate}</td>
                    <td className="py-2.5 text-gray-900">{p.invoiceNumber}</td>
                    <td className="py-2.5 text-gray-700">{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
                    <td className="py-2.5 text-right font-medium text-green-700">{formatCurrency(p.amount)}</td>
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
