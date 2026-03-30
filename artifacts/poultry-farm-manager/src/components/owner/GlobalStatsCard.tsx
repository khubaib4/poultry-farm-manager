import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GlobalStatsCardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  color: string;
}

export default function GlobalStatsCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  color,
}: GlobalStatsCardProps): React.ReactElement {
  const trendColor =
    trend === undefined || trend === 0
      ? "text-slate-400"
      : trend > 0
        ? "text-green-600"
        : "text-red-600";

  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown;

  return (
    <div className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendColor}`}>
              <TrendIcon className="h-3.5 w-3.5" />
              <span>
                {trend > 0 ? "+" : ""}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-slate-400 font-normal">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={`rounded-xl p-3 ${color.replace("text-", "bg-").replace("700", "50").replace("600", "50")}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
