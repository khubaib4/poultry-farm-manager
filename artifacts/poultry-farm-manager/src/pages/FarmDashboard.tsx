import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bird, Egg, Skull, Package } from "lucide-react";

export default function FarmDashboard(): React.ReactElement {
  const { user } = useAuth();

  const metrics = [
    { label: "Active Flocks", value: "--", icon: <Bird className="h-5 w-5" />, color: "text-blue-600 bg-blue-50" },
    { label: "Today's Eggs", value: "--", icon: <Egg className="h-5 w-5" />, color: "text-green-600 bg-green-50" },
    { label: "Mortality Rate", value: "--", icon: <Skull className="h-5 w-5" />, color: "text-red-600 bg-red-50" },
    { label: "Feed Stock", value: "--", icon: <Package className="h-5 w-5" />, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name}
        </h2>
        <p className="text-slate-500 mt-1">
          Here's an overview of your farm today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <div className={`rounded-lg p-2 ${metric.color}`}>
                {metric.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No recent activity to display.</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Vaccinations</h3>
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No upcoming vaccinations scheduled.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
