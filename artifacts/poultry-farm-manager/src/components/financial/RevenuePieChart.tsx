import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

interface RevenuePieChartProps {
  byCustomer: Array<{ name: string; amount: number }>;
  total: number;
}

function renderActiveShape(props: unknown): React.ReactElement {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props as {
    cx: number; cy: number; innerRadius: number; outerRadius: number; startAngle: number; endAngle: number;
    fill: string; payload: { name: string; value: number }; percent: number;
  };
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#111827" fontSize={13} fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" fontSize={11}>
        {formatCurrency(payload.value)} ({(percent * 100).toFixed(0)}%)
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.3} />
    </g>
  );
}

export default function RevenuePieChart({ byCustomer, total }: RevenuePieChartProps): React.ReactElement {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const data = byCustomer
    .filter(c => c.amount > 0)
    .map(c => ({ name: c.name, value: c.amount }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Customers</h3>
        <div className="h-60 flex items-center justify-center text-gray-400 text-sm">No revenue data</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Customers</h3>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              activeIndex={activeIndex}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => setActiveIndex(index)}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 space-y-1.5">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-gray-600">{entry.name}</span>
            </div>
            <span className="font-medium text-gray-900">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
