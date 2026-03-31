import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Trophy, Eye } from "lucide-react";
import CategoryBadge from "@/components/customers/CategoryBadge";
import type { TopCustomer } from "@/types/electron";

interface Props {
  data: TopCustomer[];
}

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#84cc16", "#ec4899", "#14b8a6", "#f97316"];

export default function TopCustomersReport({ data }: Props): React.ReactElement {
  const navigate = useNavigate();
  const [showChart, setShowChart] = useState(true);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        No customer sales data found for the selected period.
      </div>
    );
  }

  const chartData = data.slice(0, 10).map(c => ({
    name: c.customerName,
    value: c.totalPurchases,
  }));

  return (
    <div className="space-y-6">
      {showChart && data.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Sales Distribution</h3>
            <button
              onClick={() => setShowChart(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Hide Chart
            </button>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 border-b border-gray-200">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium text-right">Total Purchases</th>
                <th className="px-4 py-3 font-medium text-right">Total Paid</th>
                <th className="px-4 py-3 font-medium text-right">Balance Due</th>
                <th className="px-4 py-3 font-medium text-right">Sales</th>
                <th className="px-4 py-3 font-medium">Last Purchase</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((c, i) => (
                <tr key={c.customerId} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {i < 3 && <Trophy className={`h-4 w-4 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"}`} />}
                      <span className="font-medium text-gray-900">{c.rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{c.customerName}</p>
                      {c.businessName && <p className="text-xs text-gray-500">{c.businessName}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={c.category} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(c.totalPurchases)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{formatCurrency(c.totalPaid)}</td>
                  <td className={`px-4 py-3 text-right font-medium ${c.balanceDue > 0 ? "text-red-600" : "text-gray-500"}`}>
                    {formatCurrency(c.balanceDue)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{c.salesCount}</td>
                  <td className="px-4 py-3 text-gray-500">{c.lastPurchase || "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/farm/customers/${c.customerId}`)}
                      className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                      title="View Customer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
