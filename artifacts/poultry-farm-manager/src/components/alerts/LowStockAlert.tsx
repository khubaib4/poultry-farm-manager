import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, AlertTriangle, Info, X, Plus } from "lucide-react";
import type { FarmAlert } from "@/types/electron";

interface LowStockAlertProps {
  alert: FarmAlert;
  onDismiss: (alert: FarmAlert) => void;
  showActions?: boolean;
}

const severityConfig = {
  critical: { icon: <AlertCircle className="h-4 w-4" />, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  warning: { icon: <AlertTriangle className="h-4 w-4" />, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  info: { icon: <Info className="h-4 w-4" />, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
};

export default function LowStockAlert({ alert, onDismiss, showActions = true }: LowStockAlertProps): React.ReactElement {
  const navigate = useNavigate();
  const config = severityConfig[alert.severity];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
      <span className={`mt-0.5 shrink-0 ${config.text}`}>{config.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className={`text-sm font-medium ${config.text}`}>{alert.title}</p>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase ${config.badge}`}>
            {alert.severity}
          </span>
        </div>
        <p className={`text-xs ${config.text} opacity-80`}>{alert.message}</p>
        {showActions && (
          <div className="flex items-center gap-2 mt-2">
            {alert.type === "low_stock" && (
              <button
                onClick={() => navigate(alert.actionUrl)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-3 w-3" /> Restock
              </button>
            )}
            {alert.type !== "low_stock" && (
              <button
                onClick={() => navigate(alert.actionUrl)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                View
              </button>
            )}
          </div>
        )}
      </div>
      {showActions && (
        <button
          onClick={() => onDismiss(alert)}
          className="shrink-0 p-1 rounded hover:bg-white/50 transition-colors"
          title="Dismiss"
          aria-label={`Dismiss alert: ${alert.title}`}
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      )}
    </div>
  );
}
