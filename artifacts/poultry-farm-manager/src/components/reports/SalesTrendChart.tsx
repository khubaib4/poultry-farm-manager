import React from "react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { SalesTrendPoint } from "@/types/electron";

interface Props {
  data: SalesTrendPoint[];
  period: string;
}

function formatLabel(val: number) {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
  return val.toString();
}

export default function SalesTrendChart({ data, period }: Props): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        No sales data available for the selected period.
      </div>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    displayLabel: period === "daily" ? d.period.substring(5) : d.label,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Sales Trend ({period === "daily" ? "Daily" : period === "weekly" ? "Weekly" : "Monthly"})
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="displayLabel" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={formatLabel} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "revenue" ? "Revenue" : name === "collected" ? "Collected" : "Outstanding",
              ]}
            />
            <Legend />
            <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="collected" name="Collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Line dataKey="outstanding" name="Outstanding" stroke="#ef4444" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
