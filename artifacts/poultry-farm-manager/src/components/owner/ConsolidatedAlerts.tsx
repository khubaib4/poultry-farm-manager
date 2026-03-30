import React, { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import type { OwnerAlert } from "@/types/electron";

interface ConsolidatedAlertsProps {
  alerts: OwnerAlert[];
  onNavigateToFarm?: (farmId: number) => void;
}

const severityConfig = {
  critical: { icon: AlertTriangle, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  warning: { icon: AlertCircle, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
};

export default function ConsolidatedAlerts({ alerts, onNavigateToFarm }: ConsolidatedAlertsProps): React.ReactElement {
  const grouped = alerts.reduce<Record<string, { farmId: number; farmName: string; alerts: OwnerAlert[] }>>((acc, alert) => {
    const key = String(alert.farmId);
    if (!acc[key]) acc[key] = { farmId: alert.farmId, farmName: alert.farmName, alerts: [] };
    acc[key].alerts.push(alert);
    return acc;
  }, {});

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    Object.keys(grouped).forEach((k) => { init[k] = true; });
    return init;
  });

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50 mb-3">
          <Info className="h-6 w-6 text-green-500" />
        </div>
        <p className="text-slate-500">No active alerts across your farms</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Alerts</h3>
          <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">
            {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {Object.entries(grouped).map(([key, group]) => (
          <div key={key}>
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-5 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expanded[key] ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                <span className="text-sm font-medium text-slate-700">{group.farmName}</span>
                <span className="text-xs text-slate-400">({group.alerts.length})</span>
              </div>
              {onNavigateToFarm && (
                <span
                  role="link"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onNavigateToFarm(group.farmId); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onNavigateToFarm(group.farmId); } }}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  View Farm <ExternalLink className="h-3 w-3" />
                </span>
              )}
            </button>
            {expanded[key] && (
              <div className="divide-y divide-slate-50">
                {group.alerts.map((alert, i) => {
                  const config = severityConfig[alert.severity];
                  const Icon = config.icon;
                  return (
                    <div key={`${alert.type}-${alert.referenceId}-${i}`} className={`flex items-start gap-3 px-5 py-3 ${config.bg}`}>
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.text}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${config.text}`}>{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-slate-400">{alert.type.replace("_", " ")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
