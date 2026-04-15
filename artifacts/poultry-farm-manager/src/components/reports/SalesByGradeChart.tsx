import React from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { GradeBreakdownReport } from "@/types/electron";

interface Props {
  data: GradeBreakdownReport[];
}

const GRADE_LABELS: Record<string, string> = {
  A: "Grade A",
  B: "Grade B",
  cracked: "Cracked",
  other: "Other",
};

export default function SalesByGradeChart({ data }: Props): React.ReactElement {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-500">
        No grade breakdown data available.
      </div>
    );
  }

  const chartData = data.map(d => ({
    grade: GRADE_LABELS[d.grade] || d.grade,
    Eggs: d.eggsAmount,
    Trays: d.traysAmount,
    eggsQty: d.eggsQty,
    traysQty: d.traysQty,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Sales by Grade</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Legend />
            <Bar dataKey="Eggs" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Trays" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="pb-2 font-medium">Grade</th>
              <th className="pb-2 font-medium text-right">Eggs Qty</th>
              <th className="pb-2 font-medium text-right">Eggs Amount</th>
              <th className="pb-2 font-medium text-right">Trays Qty</th>
              <th className="pb-2 font-medium text-right">Trays Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.grade} className="border-b border-gray-50">
                <td className="py-2 text-gray-900">{GRADE_LABELS[d.grade] || d.grade}</td>
                  <td className="py-2 text-right text-gray-700">{Number(d.eggsQty ?? 0).toLocaleString()}</td>
                <td className="py-2 text-right text-gray-700">{formatCurrency(d.eggsAmount)}</td>
                  <td className="py-2 text-right text-gray-700">{Number(d.traysQty ?? 0).toLocaleString()}</td>
                <td className="py-2 text-right text-gray-700">{formatCurrency(d.traysAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
