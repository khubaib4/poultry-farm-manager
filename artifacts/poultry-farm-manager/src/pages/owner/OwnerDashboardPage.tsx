import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { useOwnerDashboard } from "@/hooks/useOwnerDashboard";
import GlobalStatsCard from "@/components/owner/GlobalStatsCard";
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
  Loader2,
  BarChart3,
  Calendar,
} from "lucide-react";

export default function OwnerDashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, farms, alerts, activity, isLoading, error, refresh } = useOwnerDashboard(user?.id);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (!isElectron()) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">This feature is only available in the desktop app.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
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
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4 text-slate-400" />
            <p className="text-slate-500 text-sm">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => navigate("/owner/compare")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Compare Farms
          </button>
        </div>
      </div>

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
        />
        <GlobalStatsCard
          title="Today's Eggs"
          value={stats?.totalEggsToday.toLocaleString() || "0"}
          trend={stats?.totalEggsTrend}
          trendLabel="vs yesterday"
          icon={<Egg className="h-6 w-6 text-amber-600" />}
          color="text-amber-700"
        />
        <GlobalStatsCard
          title="Revenue (Month)"
          value={`₦${(stats?.revenueMonth || 0).toLocaleString()}`}
          trend={stats?.revenueTrend}
          trendLabel="vs last month"
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          color="text-green-700"
        />
        <GlobalStatsCard
          title="Profit (Month)"
          value={`₦${(stats?.profitMonth || 0).toLocaleString()}`}
          trend={stats?.profitTrend}
          trendLabel="vs last month"
          icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
          color="text-purple-700"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Your Farms</h3>
          <button
            onClick={() => navigate("/owner/add-farm")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Farm
          </button>
        </div>
        {farms.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Bird className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-slate-700 mb-1">No farms yet</h4>
            <p className="text-sm text-slate-500 mb-4">Add your first farm to start managing your poultry operations.</p>
            <button
              onClick={() => navigate("/owner/add-farm")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Your First Farm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {farms.map((farm) => (
              <FarmOverviewCard
                key={farm.id}
                farm={farm}
                onSelectFarm={(id) => navigate(`/owner/farms`)}
              />
            ))}
            <div
              onClick={() => navigate("/owner/add-farm")}
              className="bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer flex items-center justify-center p-8 min-h-[200px]"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Add New Farm</p>
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
    </div>
  );
}
