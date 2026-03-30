import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { useDashboardData } from "@/hooks/useDashboardData";
import { getPerformanceStatus, calculateTrend, THRESHOLDS } from "@/lib/calculations";
import { Bird, Egg, Skull, Wheat, RefreshCw } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import PerformanceCard from "@/components/dashboard/PerformanceCard";
import EntryStatusWidget from "@/components/dashboard/EntryStatusWidget";
import FlockMiniCard from "@/components/dashboard/FlockMiniCard";
import AlertsPanel from "@/components/dashboard/AlertsPanel";

export default function FarmDashboard(): React.ReactElement {
  const { user } = useAuth();
  const { stats, trends, alerts, isLoading, lastUpdated, refetch } = useDashboardData();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
          <p className="text-gray-500 mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Live Birds"
              value={stats ? stats.totalBirds.toLocaleString() : "0"}
              icon={<Bird className="h-5 w-5" />}
              iconColor="text-blue-600 bg-blue-50"
            />
            <StatCard
              title="Today's Eggs"
              value={stats ? stats.todayEggs.toLocaleString() : "0"}
              icon={<Egg className="h-5 w-5" />}
              iconColor="text-green-600 bg-green-50"
              trend={eggTrend}
              trendLabel={trends ? `avg ${trends.avgEggsThisWeek}/day this week` : undefined}
            />
            <StatCard
              title="Today's Deaths"
              value={stats ? stats.todayDeaths.toString() : "0"}
              icon={<Skull className="h-5 w-5" />}
              iconColor="text-red-600 bg-red-50"
              trend={deathTrendFlipped}
              trendLabel={deathTrend === "up" ? "More than last week" : deathTrend === "down" ? "Less than last week" : undefined}
              status={stats && stats.todayDeaths > 0 && stats.totalBirds > 0 && (stats.todayDeaths / stats.totalBirds) * 100 > 0.3 ? "critical" : undefined}
            />
            <StatCard
              title="Today's Feed"
              value={stats ? stats.todayFeed.toLocaleString() : "0"}
              unit="kg"
              icon={<Wheat className="h-5 w-5" />}
              iconColor="text-amber-600 bg-amber-50"
            />
          </div>

          {trends && (trends.productionRate > 0 || trends.dailyMortalityRate > 0 || trends.fcr > 0) && (
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
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EntryStatusWidget
              flocks={stats?.flocks ?? []}
              completed={stats?.flocksCompleted ?? 0}
              total={stats?.flocksTotal ?? 0}
            />
            <AlertsPanel alerts={alerts} />
          </div>

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
            <div className="bg-white rounded-xl border p-8 text-center">
              <Bird className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Flocks</h3>
              <p className="text-sm text-gray-500 mb-4">Add your first flock to start tracking production.</p>
              <a
                href="#/farm/flocks/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Add Flock
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
