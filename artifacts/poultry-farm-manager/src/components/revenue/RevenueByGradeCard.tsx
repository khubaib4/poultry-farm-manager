import React from "react";
import { formatCurrency } from "@/lib/utils";

interface GradeData {
  qty: number;
  revenue: number;
}

interface RevenueByGradeCardProps {
  byGrade: {
    A: GradeData;
    B: GradeData;
    cracked: GradeData;
  };
  totalRevenue: number;
}

const GRADE_CONFIG = [
  { key: "A" as const, label: "Grade A", color: "bg-green-500", lightBg: "bg-green-50", text: "text-green-700" },
  { key: "B" as const, label: "Grade B", color: "bg-blue-500", lightBg: "bg-blue-50", text: "text-blue-700" },
  { key: "cracked" as const, label: "Cracked", color: "bg-amber-500", lightBg: "bg-amber-50", text: "text-amber-700" },
];

export default function RevenueByGradeCard({ byGrade, totalRevenue }: RevenueByGradeCardProps): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Egg Grade</h3>
      <div className="space-y-4">
        {GRADE_CONFIG.map(grade => {
          const data = byGrade[grade.key];
          const pct = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
          return (
            <div key={grade.key}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${grade.color}`} />
                  <span className="text-sm font-medium text-gray-700">{grade.label}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(data.revenue)}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${grade.color}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-24 text-right">
                  {data.qty.toLocaleString()} eggs · {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-sm font-bold text-gray-900">{formatCurrency(totalRevenue)}</span>
      </div>
    </div>
  );
}
