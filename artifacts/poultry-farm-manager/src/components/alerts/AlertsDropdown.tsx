import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";
import AlertBadge from "./AlertBadge";
import type { FarmAlert } from "@/types/electron";

interface AlertsDropdownProps {
  alerts: FarmAlert[];
  activeCount: number;
  criticalCount: number;
  onDismiss: (alert: FarmAlert) => void;
}

const severityIcons: Record<string, React.ReactNode> = {
  critical: <AlertCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

export default function AlertsDropdown({ alerts, activeCount, criticalCount, onDismiss }: AlertsDropdownProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeAlerts = alerts.filter(a => !a.isDismissed).slice(0, 5);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        aria-label={`Alerts${activeCount > 0 ? ` (${activeCount} active)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5">
            <AlertBadge count={activeCount} hasCritical={criticalCount > 0} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Alerts</h3>
            {activeCount > 0 && (
              <span className="text-xs text-gray-500">{activeCount} active</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {activeAlerts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-400 text-sm">No active alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors">
                    <span className="mt-0.5 shrink-0">{severityIcons[alert.severity]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDismiss(alert); }}
                      className="shrink-0 text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded hover:bg-gray-100"
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activeCount > 0 && (
            <div className="border-t border-gray-100 p-2">
              <button
                onClick={() => { navigate("/farm/alerts"); setOpen(false); }}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
              >
                View All Alerts
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
