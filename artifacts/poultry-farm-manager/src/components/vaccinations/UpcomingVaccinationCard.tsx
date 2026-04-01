import React from "react";
import { CheckCircle2, SkipForward, Clock, AlertCircle, AlertTriangle, Calendar, Syringe } from "lucide-react";
import type { UpcomingVaccination } from "@/types/electron";

const formatRoute = (route: string | null | undefined): string => {
  if (!route) return "";
  const routes: Record<string, string> = {
    eye_drop: "Eye Drop",
    drinking_water: "Drinking Water",
    injection: "Injection",
    spray: "Spray",
    wing_web: "Wing Web",
    oral: "Oral",
  };
  return routes[route] || route;
};

interface UpcomingVaccinationCardProps {
  vaccination: UpcomingVaccination;
  onComplete: (v: UpcomingVaccination) => void;
  onSkip: (v: UpcomingVaccination) => void;
}

function getUrgencyConfig(daysUntilDue: number) {
  if (daysUntilDue < 0) return { label: "Overdue", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700", icon: <AlertCircle className="h-4 w-4 text-red-500" /> };
  if (daysUntilDue <= 1) return { label: "Due Now", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700", icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> };
  if (daysUntilDue <= 7) return { label: "Due Soon", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700", icon: <Clock className="h-4 w-4 text-amber-500" /> };
  return { label: "Scheduled", bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700", icon: <Calendar className="h-4 w-4 text-green-500" /> };
}

export default function UpcomingVaccinationCard({ vaccination, onComplete, onSkip }: UpcomingVaccinationCardProps): React.ReactElement {
  const config = getUrgencyConfig(vaccination.daysUntilDue);

  return (
    <div className={`rounded-lg border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="mt-0.5 shrink-0">{config.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`text-sm font-semibold ${config.text}`}>{vaccination.vaccineName}</h4>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase ${config.badge}`}>
                {config.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {vaccination.flockName}
              <span className="text-gray-400 mx-1.5">&middot;</span>
              <span className="text-gray-500">{vaccination.flockBreed}</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
              <span>Due: {new Date(vaccination.scheduledDate).toLocaleDateString()}</span>
              <span>
                {vaccination.daysUntilDue < 0
                  ? `${Math.abs(vaccination.daysUntilDue)} day(s) overdue`
                  : vaccination.daysUntilDue === 0
                  ? "Due today"
                  : `In ${vaccination.daysUntilDue} day(s)`}
              </span>
              <span>Flock age at dose: {vaccination.vaccAgeDays} days</span>
              {vaccination.route && (
                <span className="inline-flex items-center gap-1">
                  <Syringe className="h-3 w-3" />
                  {formatRoute(vaccination.route)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onComplete(vaccination)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Complete
          </button>
          <button
            onClick={() => onSkip(vaccination)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
