import React from "react";
import type { PerformanceStatus } from "@/lib/calculations";

interface PerformanceCardProps {
  title: string;
  value: number;
  unit: string;
  description: string;
  status: PerformanceStatus;
  thresholdLabel?: string;
}

const statusColors: Record<PerformanceStatus, { bg: string; text: string; bar: string }> = {
  good: { bg: "bg-green-50", text: "text-green-700", bar: "bg-green-500" },
  warning: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500" },
  critical: { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
};

const statusLabels: Record<PerformanceStatus, string> = {
  good: "Good",
  warning: "Warning",
  critical: "Critical",
};

export default function PerformanceCard({ title, value, unit, description, status, thresholdLabel }: PerformanceCardProps): React.ReactElement {
  const colors = statusColors[status];

  return (
    <div className={`rounded-xl border p-5 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.text} ${status === "good" ? "bg-green-100" : status === "warning" ? "bg-amber-100" : "bg-red-100"}`}>
          {statusLabels[status]}
        </span>
      </div>
      <p className={`text-2xl font-bold ${colors.text}`}>
        {value}{unit}
      </p>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
      {thresholdLabel && (
        <p className="text-xs text-gray-400 mt-0.5">{thresholdLabel}</p>
      )}
    </div>
  );
}
