import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, sync } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useOwnerDashboard } from "@/hooks/useOwnerDashboard";
import GlobalStatsCard from "@/components/owner/GlobalStatsCard";
import StatDetailModal from "@/components/dashboard/StatDetailModal";
import FarmOverviewCard from "@/components/owner/FarmOverviewCard";
import FarmComparisonChart from "@/components/owner/FarmComparisonChart";
import ConsolidatedAlerts from "@/components/owner/ConsolidatedAlerts";
import RecentActivityFeed from "@/components/owner/RecentActivityFeed";
import {
  Bird,
  Egg,
  DollarSign,
  TrendingUp,
  Plus,
  RefreshCw,
  BarChart3,
  Calendar,
  Download,
  Loader2,
} from "lucide-react";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

type OwnerDashboardStatType = "birds" | "eggs" | "revenue" | "profit";

export default function OwnerDashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, farms, alerts, activity, isLoading, error, refresh } = useOwnerDashboard(user?.id);
  const [isPulling, setIsPulling] = useState(false);
  const [pullNote, setPullNote] = useState<string | null>(null);
  const [syncOnline, setSyncOnline] = useState<boolean | null>(null);
  const [detailStat, setDetailStat] = useState<{
    type: OwnerDashboardStatType;
    currentValue: string;
  } | null>(null);

  useEffect(() => {
    if (!isElectron()) return;
    void (async () => {
      try {
        const online = await sync.checkOnline();
        setSyncOnline(online);
      } catch {
        setSyncOnline(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handlePullFromCloud() {
    if (user?.type !== "owner" || user.id == null) {
      setPullNote("Sign in as an owner to pull from the cloud.");
      return;
    }
    setIsPulling(true);
    setPullNote(null);
    try {
      const result = await sync.pullFromCloud(user.id);
      if (result.success && result.stats) {
        const s = result.stats;
        setPullNote(
          `Pulled from cloud: ${s.farms} farms, ${s.flocks} flocks, ${s.entries} entries, ${s.merged} docs updated.`
        );
        await refresh();
      } else if (result.success) {
        setPullNote("Pull from cloud completed.");
        await refresh();
      } else {
        setPullNote(result.error || "Pull failed. Check Cloud Sync settings and Atlas connection.");
      }
    } catch (e) {
      setPullNote(String(e));
    } finally {
      setIsPulling(false);
    }
  }

  if (!isElectron()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">This feature is only available in the desktop app.</p>
      </div>
    );
  }

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  if (error && !stats) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const comparisonData = farms.map((f) => ({
    farmId: f.id,
    farmName: f.name,
    totalBirds: f.totalBirds,
    avgEggsPerDay: f.eggsToday,
    productionRate: f.productionRate,
    mortalityRate: f.mortalityRate,
    revenue: f.revenueMonth,
    expenses: f.expensesMonth,
    profit: f.profitMonth,
    profitMargin: f.profitMargin,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <p className="text-gray-500 text-sm">{today}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePullFromCloud}
            disabled={isPulling || syncOnline === false}
            title={
              syncOnline === false
                ? "Cloud sync is offline. Open Cloud Sync settings and check your Atlas connection."
                : "Download the latest farm data from MongoDB Atlas"
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPulling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Pull from Cloud
          </button>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => navigate("/owner/compare")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Compare Farms
          </button>
          <button
            type="button"
            onClick={() => navigate("/sync-settings")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cloud Sync
          </button>
        </div>
      </div>

      {pullNote && (
        <div className="rounded-lg bg-purple-50 border border-purple-200 px-4 py-3 text-sm text-purple-900">
          {pullNote}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlobalStatsCard
          title="Total Birds"
          value={stats?.totalBirds.toLocaleString() || "0"}
          trend={stats?.totalBirdsChange}
          trendLabel="vs last month"
          icon={<Bird className="h-6 w-6 text-blue-600" />}
          color="text-blue-700"
          onClick={() => {
            if (user?.id == null) return;
            setDetailStat({
              type: "birds",
              currentValue: `${Number(stats?.totalBirds ?? 0).toLocaleString()} birds`,
            });
          }}
        />
        <GlobalStatsCard
          title="Eggs (Month)"
          value={stats?.totalEggsMonth.toLocaleString() || "0"}
          trend={stats?.totalEggsTrend}
          trendLabel="vs last month"
          icon={<Egg className="h-6 w-6 text-amber-600" />}
          color="text-amber-700"
          onClick={() => {
            if (user?.id == null) return;
            setDetailStat({
              type: "eggs",
              currentValue: `${Number(stats?.totalEggsMonth ?? 0).toLocaleString()} eggs (month to date)`,
            });
          }}
        />
        <GlobalStatsCard
          title="Revenue (Month)"
          value={formatCurrency(stats?.revenueMonth || 0)}
          trend={stats?.revenueTrend}
          trendLabel="vs last month"
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          color="text-green-700"
          compactValue
          onClick={() => {
            if (user?.id == null) return;
            setDetailStat({
              type: "revenue",
              currentValue: formatCurrency(stats?.revenueMonth || 0),
            });
          }}
        />
        <GlobalStatsCard
          title="Profit (Month)"
          value={formatCurrency(stats?.profitMonth || 0)}
          trend={stats?.profitTrend}
          trendLabel="vs last month"
          icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
          color="text-purple-700"
          compactValue
          onClick={() => {
            if (user?.id == null) return;
            setDetailStat({
              type: "profit",
              currentValue: formatCurrency(stats?.profitMonth || 0),
            });
          }}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Farms</h3>
          <button
            onClick={() => navigate("/owner/add-farm")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Farm
          </button>
        </div>
        {farms.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200">
            <EmptyState
              icon={<Bird className="h-8 w-8" />}
              title="No farms yet"
              description="Add your first farm to start managing your poultry operations."
              actionLabel="Add Your First Farm"
              onAction={() => navigate("/owner/add-farm")}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {farms.map((farm) => (
              <FarmOverviewCard
                key={farm.id}
                farm={farm}
                onSelectFarm={(id) => navigate(`/owner/farms/${id}/dashboard`)}
              />
            ))}
            <div
              onClick={() => navigate("/owner/add-farm")}
              className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-center p-8 min-h-[200px]"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-600">Add New Farm</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {farms.length >= 2 && (
        <FarmComparisonChart data={comparisonData} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConsolidatedAlerts alerts={alerts} />
        <RecentActivityFeed activities={activity} />
      </div>

      {detailStat && user?.type === "owner" && user.id != null && (
        <StatDetailModal
          statType={detailStat.type}
          currentValue={detailStat.currentValue}
          ownerId={user.id}
          onClose={() => setDetailStat(null)}
        />
      )}
    </div>
  );
}
