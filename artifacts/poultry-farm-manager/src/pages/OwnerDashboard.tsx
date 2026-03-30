import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Plus } from "lucide-react";

export default function OwnerDashboard(): React.ReactElement {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.name}
        </h2>
        <p className="text-slate-500 mt-1">
          Manage all your farms from here.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total Farms", value: "--", color: "bg-blue-50 text-blue-700" },
          { label: "Total Birds", value: "--", color: "bg-green-50 text-green-700" },
          { label: "Today's Eggs", value: "--", color: "bg-amber-50 text-amber-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-5">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.color.split(" ")[1]}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Your Farms</h3>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Farm
        </button>
      </div>

      <div className="bg-white rounded-xl border p-12 text-center">
        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <h4 className="text-lg font-medium text-slate-700 mb-1">No farms yet</h4>
        <p className="text-sm text-slate-500 mb-4">
          Add your first farm to start managing your poultry operations.
        </p>
        <button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Your First Farm
        </button>
      </div>
    </div>
  );
}
