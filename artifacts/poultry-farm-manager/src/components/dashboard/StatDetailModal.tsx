import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { dashboard as dashboardApi, owner as ownerApi, isElectron } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { StatHistoryPoint } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StatType = "birds" | "eggs" | "deaths" | "feed" | "sales" | "revenue" | "profit" | "outstanding";

interface StatConfig {
  title: string;
  color: string;
  gradientId: string;
  unit?: string;
  isCurrency?: boolean;
}

const statConfigs: Record<StatType, StatConfig> = {
  birds: { title: "Total Live Birds", color: "#2563eb", gradientId: "birdsGrad", unit: "birds" },
  eggs: { title: "Eggs Collected", color: "#16a34a", gradientId: "eggsGrad", unit: "eggs" },
  deaths: { title: "Deaths", color: "#dc2626", gradientId: "deathsGrad", unit: "birds" },
  feed: { title: "Feed Consumed", color: "#d97706", gradientId: "feedGrad", unit: "kg" },
  sales: { title: "Number of Sales", color: "#059669", gradientId: "salesGrad", unit: "sales" },
  revenue: { title: "Revenue", color: "#16a34a", gradientId: "revenueGrad", isCurrency: true },
  profit: { title: "Profit", color: "#4f46e5", gradientId: "profitGrad", isCurrency: true },
  outstanding: { title: "Outstanding Balance", color: "#d97706", gradientId: "outstandingGrad", isCurrency: true },
};

const rangeOptions = [
  { label: "7 Days", days: 7 },
  { label: "14 Days", days: 14 },
  { label: "30 Days", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
];

interface StatDetailModalProps {
  statType: StatType;
  currentValue: string;
  onClose: () => void;
  /** When set, history is aggregated across all farms for this owner */
  ownerId?: number;
}

export default function StatDetailModal({
  statType,
  currentValue,
  onClose,
  ownerId,
}: StatDetailModalProps): React.ReactElement {
  const { user } = useAuth();
  const effectiveFarmId = useFarmId();
  const farmId = ownerId != null ? null : effectiveFarmId;
  const [data, setData] = useState<StatHistoryPoint[]>([]);
  const [days, setDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const config = statConfigs[statType];

  useEffect(() => {
    if (!isElectron()) {
      setIsLoading(false);
      setData([]);
      return;
    }
    if (ownerId == null && farmId == null) {
      setIsLoading(false);
      setData([]);
      return;
    }
    setIsLoading(true);
    const req =
      ownerId != null
        ? ownerApi.getStatHistory(ownerId, statType, days)
        : dashboardApi.getStatHistory(farmId!, statType, days);
    req
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setIsLoading(false));
  }, [farmId, ownerId, statType, days]);

  const summary = React.useMemo(() => {
    if (data.length === 0) return null;
    const values = data.map(d => d.value);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;
    const changePct = first !== 0 ? (change / first) * 100 : 0;
    const maxDate = data[values.indexOf(maxVal)]?.date;
    const minDate = data[values.indexOf(minVal)]?.date;
    return { maxVal, minVal, avg, change, changePct, maxDate, minDate };
  }, [data]);

  const formatValue = (val: number): string => {
    if (config.isCurrency) return formatCurrency(val);
    return Number(val ?? 0).toLocaleString();
  };

  const formatDate = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00");
    if (days <= 14) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (days <= 30) return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const tickInterval = days <= 7 ? 0 : days <= 14 ? 1 : days <= 30 ? 4 : days <= 90 ? 13 : 29;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{config.title}</h2>
            {ownerId != null && (
              <p className="text-xs text-gray-500 mt-0.5">All farms (combined)</p>
            )}
            <p className="text-sm text-gray-500 mt-0.5">Current: {currentValue}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5">
            {rangeOptions.map(opt => (
              <button
                key={opt.days}
                onClick={() => setDays(opt.days)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  days === opt.days
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-56">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
              No data available for this period
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    interval={tickInterval}
                    axisLine={{ stroke: "#e5e7eb" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickFormatter={(v) => config.isCurrency ? `${Math.round(v / 1000)}k` : v.toLocaleString()}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatValue(value), config.title]}
                    labelFormatter={formatDate}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={config.color}
                    strokeWidth={2}
                    fill={`url(#${config.gradientId})`}
                    dot={data.length <= 14}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {summary && !isLoading && (
          <div className="px-6 pb-5 border-t border-gray-100 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SummaryItem label="Highest" value={formatValue(summary.maxVal)} sub={summary.maxDate ? formatDate(summary.maxDate) : ""} />
              <SummaryItem label="Lowest" value={formatValue(summary.minVal)} sub={summary.minDate ? formatDate(summary.minDate) : ""} />
              <SummaryItem label="Average" value={formatValue(Math.round(summary.avg))} />
              <SummaryItem
                label="Change"
                value={`${summary.change >= 0 ? "+" : ""}${formatValue(summary.change)}`}
                sub={`${summary.changePct >= 0 ? "+" : ""}${summary.changePct.toFixed(1)}%`}
                changePositive={statType === "deaths" ? summary.change <= 0 : summary.change >= 0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value, sub, changePositive }: {
  label: string;
  value: string;
  sub?: string;
  changePositive?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
      {sub && (
        <p className={`text-xs mt-0.5 ${
          changePositive !== undefined
            ? changePositive ? "text-green-600" : "text-red-600"
            : "text-gray-400"
        }`}>{sub}</p>
      )}
    </div>
  );
}
