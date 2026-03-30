import React, { useState } from "react";
import { isElectron } from "@/lib/api";
import { useAlerts } from "@/hooks/useAlerts";
import { Bell, RefreshCw } from "lucide-react";
import LowStockAlertsList from "@/components/alerts/LowStockAlertsList";
import type { FarmAlert } from "@/types/electron";

type TabType = "active" | "dismissed" | "all";
type FilterType = "all" | "low_stock" | "expiring" | "vaccination_due";

export default function AlertsPage(): React.ReactElement {
  const {
    alerts,
    activeAlerts,
    dismissedAlerts,
    activeCount,
    isLoading,
    dismiss,
    undismiss,
    clearDismissed,
    refetch,
  } = useAlerts();

  const [tab, setTab] = useState<TabType>("active");
  const [filter, setFilter] = useState<FilterType>("all");
  const [refreshing, setRefreshing] = useState(false);

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Alerts are only available in the desktop app.
        </div>
      </div>
    );
  }

  let displayAlerts: FarmAlert[];
  if (tab === "active") displayAlerts = activeAlerts;
  else if (tab === "dismissed") displayAlerts = dismissedAlerts;
  else displayAlerts = alerts;

  if (filter !== "all") {
    displayAlerts = displayAlerts.filter(a => a.type === filter);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }

  async function handleDismissAll() {
    for (const alert of displayAlerts.filter(a => !a.isDismissed)) {
      await dismiss(alert);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Bell className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {activeCount} active alert{activeCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            {(["active", "dismissed", "all"] as TabType[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors capitalize ${
                  tab === t ? "bg-green-100 text-green-700 font-medium" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t}
                {t === "active" && activeCount > 0 && (
                  <span className="ml-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{activeCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            {(["all", "low_stock", "expiring", "vaccination_due"] as FilterType[]).map(f => {
              const labels: Record<FilterType, string> = {
                all: "All Types",
                low_stock: "Low Stock",
                expiring: "Expiring",
                vaccination_due: "Vaccinations",
              };
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                    filter === f ? "bg-gray-200 text-gray-800 font-medium" : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {labels[f]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading alerts...</p>
        </div>
      ) : tab === "dismissed" ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {dismissedAlerts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No dismissed alerts</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{displayAlerts.length} dismissed alert{displayAlerts.length !== 1 ? "s" : ""}</p>
                <button
                  onClick={clearDismissed}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Re-enable All
                </button>
              </div>
              <div className="space-y-2 opacity-60">
                {displayAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{alert.title}</p>
                      <p className="text-xs text-gray-400">{alert.message}</p>
                    </div>
                    <button
                      onClick={() => undismiss(alert)}
                      className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-green-50"
                    >
                      Re-enable
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <LowStockAlertsList
            alerts={displayAlerts.filter(a => tab === "all" || !a.isDismissed)}
            onDismiss={dismiss}
            onDismissAll={handleDismissAll}
            showDismissAll={tab === "active"}
          />
        </div>
      )}
    </div>
  );
}
