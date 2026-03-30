import React from "react";
import { Package, Pill, Wrench, Syringe, CheckCircle2 } from "lucide-react";
import LowStockAlert from "./LowStockAlert";
import type { FarmAlert } from "@/types/electron";

interface LowStockAlertsListProps {
  alerts: FarmAlert[];
  onDismiss: (alert: FarmAlert) => void;
  onDismissAll?: () => void;
  showDismissAll?: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  low_stock: { label: "Low Stock", icon: <Package className="h-4 w-4 text-amber-600" /> },
  expiring: { label: "Expiring Items", icon: <Pill className="h-4 w-4 text-blue-600" /> },
  vaccination_due: { label: "Vaccination Due", icon: <Syringe className="h-4 w-4 text-purple-600" /> },
};

export default function LowStockAlertsList({ alerts, onDismiss, onDismissAll, showDismissAll = false }: LowStockAlertsListProps): React.ReactElement {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-300 mb-3" />
        <p className="text-gray-500 font-medium">No active alerts</p>
        <p className="text-gray-400 text-sm mt-1">Everything looks good!</p>
      </div>
    );
  }

  const grouped: Record<string, FarmAlert[]> = {};
  for (const alert of alerts) {
    if (!grouped[alert.type]) grouped[alert.type] = [];
    grouped[alert.type].push(alert);
  }

  const typeOrder = ["low_stock", "expiring", "vaccination_due"];
  const sortedTypes = Object.keys(grouped).sort((a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b));

  return (
    <div className="space-y-6">
      {showDismissAll && alerts.length > 1 && (
        <div className="flex justify-end">
          <button
            onClick={onDismissAll}
            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
          >
            Dismiss All
          </button>
        </div>
      )}
      {sortedTypes.map(type => {
        const config = TYPE_CONFIG[type] ?? { label: type, icon: <Wrench className="h-4 w-4 text-gray-500" /> };
        const typeAlerts = grouped[type].sort((a, b) => {
          const priority: Record<string, number> = { critical: 0, warning: 1, info: 2 };
          return (priority[a.severity] ?? 2) - (priority[b.severity] ?? 2);
        });

        return (
          <div key={type}>
            <div className="flex items-center gap-2 mb-3">
              {config.icon}
              <h4 className="text-sm font-semibold text-gray-700">{config.label}</h4>
              <span className="text-xs text-gray-400">({typeAlerts.length})</span>
            </div>
            <div className="space-y-2">
              {typeAlerts.map(alert => (
                <LowStockAlert key={alert.id} alert={alert} onDismiss={onDismiss} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
