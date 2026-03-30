import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { DailyRevenueEntry } from "@/types/electron";

interface RevenueChartProps {
  data: DailyRevenueEntry[];
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || !label) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1.5">{formatDateShort(label)}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.dataKey === "gradeARevenue" ? "Grade A" : p.dataKey === "gradeBRevenue" ? "Grade B" : "Cracked"}:</span>
          <span className="font-medium text-gray-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart({ data }: RevenueChartProps): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          No revenue data for this period
        </div>
      </div>
    );
  }

  const chartData = [...data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      date: d.date,
      gradeARevenue: d.gradeA.revenue,
      gradeBRevenue: d.gradeB.revenue,
      crackedRevenue: d.cracked.revenue,
    }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "#9ca3af" }}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="gradeARevenue" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
            <Bar dataKey="gradeBRevenue" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="crackedRevenue" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-green-500" /><span className="text-xs text-gray-500">Grade A</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-blue-500" /><span className="text-xs text-gray-500">Grade B</span></div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-amber-500" /><span className="text-xs text-gray-500">Cracked</span></div>
      </div>
    </div>
  );
}
