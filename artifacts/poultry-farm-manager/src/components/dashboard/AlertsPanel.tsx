import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react";

interface Alert {
  type: "critical" | "warning" | "info";
  message: string;
  link?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertConfig: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  critical: { icon: <AlertCircle className="h-4 w-4" />, bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
  info: { icon: <Info className="h-4 w-4" />, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" },
};

export default function AlertsPanel({ alerts }: AlertsPanelProps): React.ReactElement {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  if (alerts.length === 0) return <></>;

  const criticalCount = alerts.filter(a => a.type === "critical").length;
  const warningCount = alerts.filter(a => a.type === "warning").length;

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
          <div className="flex gap-1.5">
            {criticalCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{criticalCount}</span>
            )}
            {warningCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{warningCount}</span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="px-5 pb-4 space-y-2">
          {alerts.map((alert, idx) => {
            const config = alertConfig[alert.type];
            return (
              <div
                key={idx}
                onClick={() => alert.link && navigate(alert.link)}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border} ${alert.link ? "cursor-pointer hover:opacity-80" : ""}`}
              >
                <span className={`mt-0.5 shrink-0 ${config.text}`}>{config.icon}</span>
                <p className={`text-sm ${config.text}`}>{alert.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
