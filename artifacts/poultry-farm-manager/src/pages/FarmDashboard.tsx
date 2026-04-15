import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePaymentAlerts } from "@/hooks/usePaymentAlerts";
import { getPerformanceStatus, calculateTrend, THRESHOLDS } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";
import {
  Bird, Egg, Skull, Wheat, RefreshCw,
  ShoppingCart, TrendingUp, DollarSign, AlertCircle,
  ArrowRight, Plus, Receipt,
} from "lucide-react";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import StatCard from "@/components/dashboard/StatCard";
import PerformanceCard from "@/components/dashboard/PerformanceCard";
import EntryStatusWidget from "@/components/dashboard/EntryStatusWidget";
import FlockMiniCard from "@/components/dashboard/FlockMiniCard";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import PaymentAlerts from "@/components/alerts/PaymentAlerts";
import StatDetailModal from "@/components/dashboard/StatDetailModal";
import { useFarmId, useOwnerFarmReadOnly } from "@/hooks/useFarmId";
import { useFarmPath } from "@/hooks/useFarmPath";

type StatType = "birds" | "eggs" | "deaths" | "feed" | "sales" | "revenue" | "profit" | "outstanding";

export default function FarmDashboard(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmPath = useFarmPath();
  const readOnly = useOwnerFarmReadOnly();
  const { stats, trends, alerts, isLoading, lastUpdated, refetch } = useDashboardData();
  const farmId = useFarmId();
  const { alerts: paymentAlerts } = usePaymentAlerts(farmId);
  const [selectedStat, setSelectedStat] = useState<{ type: StatType; currentValue: string } | null>(null);

  if (!isElectron()) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">This feature requires the desktop application.</p>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const eggTrend = trends ? calculateTrend(trends.avgEggsThisWeek, trends.avgEggsLastWeek) : undefined;
  const deathTrend = trends ? calculateTrend(trends.thisWeek.deaths, trends.lastWeek.deaths) : undefined;
  const deathTrendFlipped = deathTrend === "up" ? "down" as const : deathTrend === "down" ? "up" as const : deathTrend;

  const productionStatus = trends ? getPerformanceStatus(trends.productionRate, THRESHOLDS.productionRate) : "good";
  const mortalityStatus = trends ? getPerformanceStatus(trends.dailyMortalityRate, THRESHOLDS.dailyMortality) : "good";
  const fcrStatus = trends ? getPerformanceStatus(trends.fcr, THRESHOLDS.fcr) : "good";

  const statusColors: Record<string, string> = {
    paid: "text-green-700 bg-green-50",
    partial: "text-amber-700 bg-amber-50",
    unpaid: "text-red-700 bg-red-50",
  };

  function formatRelativeDate(dateStr: string): string {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (dateStr === todayStr) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", { month: "short", day: "numeric" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
          <p className="text-gray-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <button
              type="button"
              onClick={() => navigate(farmPath("sales/new"))}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Sale
            </button>
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refetch}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {isLoading && !stats ? (
        <SkeletonDashboard />
      ) : (
        <>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Production Today</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Live Birds"
                value={Number(stats?.totalBirds ?? 0).toLocaleString()}
                icon={<Bird className="h-5 w-5" />}
                iconColor="text-blue-600 bg-blue-50"
                onClick={() => setSelectedStat({ type: "birds", currentValue: `${Number(stats?.totalBirds ?? 0).toLocaleString()} birds` })}
              />
              <StatCard
                title="Today's Eggs"
                value={Number(stats?.todayEggs ?? 0).toLocaleString()}
                icon={<Egg className="h-5 w-5" />}
                iconColor="text-green-600 bg-green-50"
                trend={eggTrend}
                trendLabel={trends ? `avg ${trends.avgEggsThisWeek}/day this week` : undefined}
                onClick={() => setSelectedStat({ type: "eggs", currentValue: `${Number(stats?.todayEggs ?? 0).toLocaleString()} eggs` })}
              />
              <StatCard
                title="Today's Deaths"
                value={stats ? stats.todayDeaths.toString() : "0"}
                icon={<Skull className="h-5 w-5" />}
                iconColor="text-red-600 bg-red-50"
                trend={deathTrendFlipped}
                trendLabel={deathTrend === "up" ? "More than last week" : deathTrend === "down" ? "Less than last week" : undefined}
                status={stats && stats.todayDeaths > 0 && stats.totalBirds > 0 && (stats.todayDeaths / stats.totalBirds) * 100 > 0.3 ? "critical" : undefined}
                onClick={() => setSelectedStat({ type: "deaths", currentValue: `${stats?.todayDeaths ?? "0"} deaths` })}
              />
              <StatCard
                title="Today's Feed"
                value={Number(stats?.todayFeed ?? 0).toLocaleString()}
                unit="kg"
                icon={<Wheat className="h-5 w-5" />}
                iconColor="text-amber-600 bg-amber-50"
                onClick={() => setSelectedStat({ type: "feed", currentValue: `${Number(stats?.todayFeed ?? 0).toLocaleString()} kg` })}
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Sales & Revenue</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
                onClick={() => setSelectedStat({ type: "sales", currentValue: `${stats?.todaySalesCount ?? 0} sales` })}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">Today's Sales</p>
                  <div className="rounded-lg p-2 text-emerald-600 bg-emerald-50">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-3xl font-bold text-gray-900">{stats?.todaySalesCount ?? 0}</p>
                  <span className="text-sm text-gray-500">{stats?.todaySalesCount === 1 ? "sale" : "sales"}</span>
                </div>
                {stats && stats.todaySalesAmount > 0 && (
                  <p className="text-sm text-emerald-600 font-medium mt-1">{formatCurrency(stats.todaySalesAmount)}</p>
                )}
              </div>

              <StatCard
                title="Month Revenue"
                value={stats ? formatCurrency(stats.monthRevenue) : "Rs 0"}
                icon={<DollarSign className="h-5 w-5" />}
                iconColor="text-green-600 bg-green-50"
                onClick={() => setSelectedStat({ type: "revenue", currentValue: stats ? formatCurrency(stats.monthRevenue) : "Rs 0" })}
              />

              <div
                className="bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all"
                onClick={() => setSelectedStat({ type: "profit", currentValue: stats ? formatCurrency(stats.monthProfit) : "Rs 0" })}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">Month Profit</p>
                  <div className="rounded-lg p-2 text-indigo-600 bg-indigo-50">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className={`text-3xl font-bold ${stats && stats.monthProfit < 0 ? "text-red-600" : "text-gray-900"}`}>
                    {stats ? formatCurrency(stats.monthProfit) : "Rs 0"}
                  </p>
                </div>
                {stats && stats.monthRevenue > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((stats.monthProfit / stats.monthRevenue) * 100)}% margin
                  </p>
                )}
              </div>

              <div
                className={`bg-white rounded-xl border p-5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all ${stats && stats.totalOutstanding > 0 ? "border-l-4 border-l-amber-500" : ""}`}
                onClick={() => setSelectedStat({ type: "outstanding", currentValue: stats ? formatCurrency(stats.totalOutstanding) : "Rs 0" })}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">Outstanding</p>
                  <div className="rounded-lg p-2 text-amber-600 bg-amber-50">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <p className={`text-3xl font-bold ${stats && stats.totalOutstanding > 0 ? "text-amber-600" : "text-gray-900"}`}>
                    {stats ? formatCurrency(stats.totalOutstanding) : "Rs 0"}
                  </p>
                </div>
                {stats && stats.totalOutstanding > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(farmPath("receivables")); }}
                    className="text-xs text-amber-600 hover:text-amber-700 mt-1 font-medium"
                  >
                    View receivables
                  </button>
                )}
              </div>
            </div>
          </div>

          {paymentAlerts.length > 0 && (
            <PaymentAlerts alerts={paymentAlerts} maxItems={5} />
          )}

          {trends && (trends.productionRate > 0 || trends.dailyMortalityRate > 0 || trends.fcr > 0) && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PerformanceCard
                  title="Production Rate"
                  value={trends.productionRate}
                  unit="%"
                  description="7-day average eggs per bird per day"
                  status={productionStatus}
                  thresholdLabel="Target: >85%"
                />
                <PerformanceCard
                  title="Daily Mortality"
                  value={trends.dailyMortalityRate}
                  unit="%"
                  description="7-day average daily death rate"
                  status={mortalityStatus}
                  thresholdLabel="Target: <0.1%"
                />
                <PerformanceCard
                  title="Feed Conversion"
                  value={trends.fcr}
                  unit=""
                  description="kg feed per egg (7-day)"
                  status={fcrStatus}
                  thresholdLabel="Target: <2.0"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EntryStatusWidget
              flocks={stats?.flocks ?? []}
              completed={stats?.flocksCompleted ?? 0}
              total={stats?.flocksTotal ?? 0}
            />
            <AlertsPanel alerts={alerts} />
          </div>

          {stats && stats.recentSales.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-gray-400" />
                  <h3 className="text-base font-semibold text-gray-900">Recent Sales</h3>
                </div>
                <button
                  onClick={() => navigate(farmPath("sales"))}
                  className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  View All <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {stats.recentSales.map(sale => (
                  <button
                    key={sale.id}
                    onClick={() => navigate(farmPath(`sales/${sale.id}`))}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-gray-600">
                          {sale.customerName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{sale.customerName}</p>
                        <p className="text-xs text-gray-500">{sale.invoiceNumber} · {formatRelativeDate(sale.saleDate)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.totalAmount)}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[sale.paymentStatus] || "text-gray-600 bg-gray-50"}`}>
                        {sale.paymentStatus.charAt(0).toUpperCase() + sale.paymentStatus.slice(1)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {stats && stats.flocks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Active Flocks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stats.flocks.map(flock => (
                  <FlockMiniCard
                    key={flock.id}
                    id={flock.id}
                    batchName={flock.batchName}
                    breed={flock.breed}
                    currentCount={flock.currentCount}
                    arrivalDate={flock.arrivalDate}
                    ageAtArrivalDays={flock.ageAtArrivalDays}
                    hasEntryToday={flock.hasEntryToday}
                  />
                ))}
              </div>
            </div>
          )}

          {stats && stats.flocks.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200">
              <EmptyState
                icon={<Bird className="h-8 w-8" />}
                title="No Active Flocks"
                description={
                  readOnly
                    ? "This farm has no active flocks yet."
                    : "Add your first flock to start tracking production."
                }
                actionLabel={readOnly ? undefined : "Add Flock"}
                onAction={readOnly ? undefined : () => navigate(farmPath("flocks/new"))}
              />
            </div>
          )}
        </>
      )}

      {selectedStat && (
        <StatDetailModal
          statType={selectedStat.type}
          currentValue={selectedStat.currentValue}
          onClose={() => setSelectedStat(null)}
        />
      )}
    </div>
  );
}
