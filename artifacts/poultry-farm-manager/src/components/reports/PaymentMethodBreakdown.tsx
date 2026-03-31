import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
  percentage: number;
}

interface Props {
  data: PaymentMethodData[];
}

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

export default function PaymentMethodBreakdown({ data }: Props): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        No payment data available.
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: METHOD_LABELS[d.method] || d.method,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment Methods</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ label, percentage }) => `${label} (${percentage}%)`}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1.5">
        {chartData.map((d, i) => (
          <div key={d.method} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-gray-700">{d.label}</span>
            </div>
            <div className="text-right">
              <span className="font-medium text-gray-900">{formatCurrency(d.amount)}</span>
              <span className="text-gray-500 ml-2">({d.count} txns)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
