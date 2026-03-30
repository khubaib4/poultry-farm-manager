import React from "react";
import { Egg, Receipt, Syringe, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { RecentActivity } from "@/types/electron";

interface RecentActivityFeedProps {
  activities: RecentActivity[];
}

const typeConfig = {
  entry: { icon: Egg, bg: "bg-amber-50", text: "text-amber-600" },
  expense: { icon: Receipt, bg: "bg-red-50", text: "text-red-600" },
  vaccination: { icon: Syringe, bg: "bg-blue-50", text: "text-blue-600" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === yesterdayStr) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps): React.ReactElement {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-8 text-center">
        <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
        <p className="text-slate-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-5 border-b">
        <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
        {activities.map((activity, i) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          return (
            <div key={`${activity.type}-${activity.id}-${i}`} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className={`rounded-lg p-2 ${config.bg} flex-shrink-0`}>
                <Icon className={`h-4 w-4 ${config.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{activity.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-medium">
                    {activity.farmName}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(activity.date)}</span>
                  {activity.amount !== undefined && (
                    <span className="text-xs font-medium text-gray-600">{formatCurrency(activity.amount)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
