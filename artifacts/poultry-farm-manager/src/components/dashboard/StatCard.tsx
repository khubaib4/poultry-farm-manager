import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Trend, PerformanceStatus } from "@/lib/calculations";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  iconColor: string;
  trend?: Trend;
  trendLabel?: string;
  subtitle?: string;
  status?: PerformanceStatus;
  onClick?: () => void;
}

const trendIcons: Record<Trend, React.ReactNode> = {
  up: <TrendingUp className="h-3.5 w-3.5" />,
  down: <TrendingDown className="h-3.5 w-3.5" />,
  same: <Minus className="h-3.5 w-3.5" />,
};

const statusBorder: Record<PerformanceStatus, string> = {
  good: "border-l-green-500",
  warning: "border-l-amber-500",
  critical: "border-l-red-500",
};

export default function StatCard({ title, value, unit, icon, iconColor, trend, trendLabel, subtitle, status, onClick }: StatCardProps): React.ReactElement {
  const trendColor = trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-gray-400";

  return (
    <div
      className={`bg-white rounded-xl border p-5 ${status ? `border-l-4 ${statusBorder[status]}` : ""} ${onClick ? "cursor-pointer hover:shadow-md hover:border-gray-300 transition-all" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">{title}</p>
        <div className={`rounded-lg p-2 ${iconColor}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
      {trend && trendLabel && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${trendColor}`}>
          {trendIcons[trend]}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
