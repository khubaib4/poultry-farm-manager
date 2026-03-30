import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { FarmComparisonData } from "@/types/electron";

interface FarmComparisonChartProps {
  data: FarmComparisonData[];
}

type MetricKey = "totalBirds" | "avgEggsPerDay" | "productionRate" | "mortalityRate" | "revenue" | "expenses" | "profit" | "profitMargin";

const metricOptions: { key: MetricKey; label: string; color: string; format: (v: number) => string }[] = [
  { key: "productionRate", label: "Production Rate (%)", color: "#2563eb", format: (v) => `${v}%` },
  { key: "mortalityRate", label: "Mortality Rate (%)", color: "#dc2626", format: (v) => `${v}%` },
  { key: "profitMargin", label: "Profit Margin (%)", color: "#16a34a", format: (v) => `${v}%` },
  { key: "totalBirds", label: "Total Birds", color: "#7c3aed", format: (v) => v.toLocaleString() },
  { key: "avgEggsPerDay", label: "Avg Eggs/Day", color: "#ea580c", format: (v) => v.toLocaleString() },
  { key: "revenue", label: "Revenue", color: "#0891b2", format: (v) => `PKR ${v.toLocaleString()}` },
  { key: "expenses", label: "Expenses", color: "#be185d", format: (v) => `PKR ${v.toLocaleString()}` },
  { key: "profit", label: "Profit", color: "#15803d", format: (v) => `PKR ${v.toLocaleString()}` },
];

export default function FarmComparisonChart({ data }: FarmComparisonChartProps): React.ReactElement {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("productionRate");
  const metric = metricOptions.find((m) => m.key === selectedMetric)!;

  const chartData = data.map((d) => ({
    name: d.farmName.length > 12 ? d.farmName.substring(0, 12) + "..." : d.farmName,
    value: d[selectedMetric],
  }));

  return (
    <div className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Farm Comparison</h3>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {metricOptions.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <div className="py-12 text-center text-slate-400">No farms to compare</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip
              formatter={(value: number) => [metric.format(value), metric.label]}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Bar dataKey="value" fill={metric.color} radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
