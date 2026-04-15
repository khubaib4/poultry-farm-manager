import React from "react";
import { useNavigate } from "react-router-dom";
import { Bird, AlertTriangle } from "lucide-react";
import { formatAge } from "@/lib/utils";
import { useFarmPath } from "@/hooks/useFarmPath";

interface FlockCardProps {
  flock: {
    id: number;
    batchName: string;
    breed?: string | null;
    initialCount: number;
    currentCount: number;
    ageDays: number;
    status?: string | null;
    mortalityRate: number;
    productionRate: number;
    eggsLast7Days: number;
  };
}

export default function FlockCard({ flock }: FlockCardProps): React.ReactElement {
  const navigate = useNavigate();
  const farmPath = useFarmPath();
  const safeCurrentCount = Number(flock.currentCount ?? 0);
  const safeInitialCount = Number(flock.initialCount ?? 0);
  const safeEggsLast7Days = Number(flock.eggsLast7Days ?? 0);
  const safeMortalityRate = Number(flock.mortalityRate ?? 0);
  const safeProductionRate = Number(flock.productionRate ?? 0);

  const statusColors: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    culled: "bg-slate-100 text-slate-500",
    sold: "bg-blue-50 text-blue-700",
  };

  const statusColor = statusColors[flock.status || "active"] || statusColors.active;

  return (
    <div
      className="bg-white rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(farmPath(`flocks/${flock.id}`))}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-slate-900">{flock.batchName}</h3>
            {flock.breed && (
              <p className="text-sm text-slate-500 mt-0.5">{flock.breed}</p>
            )}
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor}`}>
            {flock.status || "active"}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            {formatAge(flock.ageDays)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Birds</p>
            <div className="flex items-center gap-1">
              <Bird className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-900">
                {safeCurrentCount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                / {safeInitialCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-xs">Eggs (7d)</p>
            <p className="font-medium text-slate-900">
              {safeEggsLast7Days.toLocaleString()}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <p className="text-slate-500 text-xs">Mortality</p>
              {safeMortalityRate > 1 && (
                <AlertTriangle className="h-3 w-3 text-amber-500" />
              )}
            </div>
            <p className={`font-medium ${safeMortalityRate > 1 ? "text-amber-600" : "text-slate-900"}`}>
              {Number(flock.mortalityRate ?? 0).toFixed(1)}%
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1">
              <p className="text-slate-500 text-xs">Production</p>
              {safeProductionRate > 0 && safeProductionRate < 80 && flock.status === "active" && (
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              )}
            </div>
            <p className={`font-medium ${safeProductionRate > 0 && safeProductionRate < 80 && flock.status === "active" ? "text-orange-600" : "text-slate-900"}`}>
              {safeProductionRate > 0 ? `${Number(flock.productionRate ?? 0).toFixed(1)}%` : "--"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
