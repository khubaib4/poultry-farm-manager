import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Bird,
  Egg,
  MoreVertical,
  BarChart3,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface FarmOverviewCardProps {
  farm: {
    id: number;
    name: string;
    location: string | null;
    totalBirds: number;
    totalFlocks: number;
    eggsToday: number;
    flocksWithEntriesToday: number;
    productionRate: number;
    mortalityRate: number;
    profitMargin: number;
    revenueMonth: number;
    expensesMonth: number;
    profitMonth: number;
    performance: "good" | "warning" | "critical";
  };
  onSelectFarm: (farmId: number) => void;
}

const performanceConfig = {
  good: { border: "border-l-green-500", bg: "bg-green-50", text: "text-green-700", label: "Good" },
  warning: { border: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700", label: "Warning" },
  critical: { border: "border-l-red-500", bg: "bg-red-50", text: "text-red-700", label: "Critical" },
};

export default function FarmOverviewCard({ farm, onSelectFarm }: FarmOverviewCardProps): React.ReactElement {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const config = performanceConfig[farm.performance];

  return (
    <div
      className={`bg-white rounded-xl border border-l-4 ${config.border} hover:shadow-md transition-all cursor-pointer relative`}
      onClick={() => onSelectFarm(farm.id)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-lg truncate">{farm.name}</h3>
            {farm.location && (
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{farm.location}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
              {config.label}
            </span>
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                  <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border bg-white shadow-lg py-1">
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onSelectFarm(farm.id); }} className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <ArrowRight className="h-4 w-4" /> View Dashboard
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate("/owner/compare"); }} className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" /> Compare
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); navigate("/owner/reports"); }} className="w-full px-3 py-2 text-sm text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Reports
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Bird className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-slate-400">Birds</p>
              <p className="text-sm font-semibold text-slate-800">{Number(farm.totalBirds ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Egg className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-xs text-slate-400">Eggs Today</p>
              <p className="text-sm font-semibold text-slate-800">{Number(farm.eggsToday ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {farm.flocksWithEntriesToday >= farm.totalFlocks ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-xs text-slate-500">
            {farm.flocksWithEntriesToday} of {farm.totalFlocks} flocks entered today
          </span>
        </div>

        <div className="border-t pt-3 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-slate-400">Production</p>
            <p className={`text-sm font-semibold ${farm.productionRate >= 85 ? "text-green-600" : farm.productionRate >= 70 ? "text-amber-600" : "text-red-600"}`}>
              {farm.productionRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Mortality</p>
            <p className={`text-sm font-semibold ${farm.mortalityRate <= 0.5 ? "text-green-600" : farm.mortalityRate <= 1 ? "text-amber-600" : "text-red-600"}`}>
              {farm.mortalityRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Profit</p>
            <p className={`text-sm font-semibold ${farm.profitMargin >= 20 ? "text-green-600" : farm.profitMargin >= 10 ? "text-amber-600" : "text-red-600"}`}>
              {farm.profitMargin}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
