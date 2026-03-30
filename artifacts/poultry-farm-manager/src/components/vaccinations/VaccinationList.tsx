import React from "react";
import { CheckCircle2 } from "lucide-react";
import UpcomingVaccinationCard from "./UpcomingVaccinationCard";
import type { UpcomingVaccination } from "@/types/electron";

interface VaccinationListProps {
  vaccinations: UpcomingVaccination[];
  onComplete: (v: UpcomingVaccination) => void;
  onSkip: (v: UpcomingVaccination) => void;
  groupBy?: "urgency" | "flock";
  filterFlockId?: number | null;
}

export default function VaccinationList({ vaccinations, onComplete, onSkip, groupBy = "urgency", filterFlockId }: VaccinationListProps): React.ReactElement {
  let filtered = vaccinations;
  if (filterFlockId) {
    filtered = filtered.filter(v => v.flockId === filterFlockId);
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-300 mb-3" />
        <p className="text-gray-500 font-medium">No upcoming vaccinations</p>
        <p className="text-gray-400 text-sm mt-1">All vaccinations are up to date!</p>
      </div>
    );
  }

  if (groupBy === "flock") {
    const grouped: Record<string, UpcomingVaccination[]> = {};
    for (const v of filtered) {
      const key = v.flockName;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    }

    return (
      <div className="space-y-6">
        {Object.entries(grouped).map(([flockName, items]) => (
          <div key={flockName}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{flockName}</h4>
            <div className="space-y-2">
              {items.map(v => (
                <UpcomingVaccinationCard key={v.id} vaccination={v} onComplete={onComplete} onSkip={onSkip} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const overdue = filtered.filter(v => v.daysUntilDue < 0);
  const dueNow = filtered.filter(v => v.daysUntilDue >= 0 && v.daysUntilDue <= 1);
  const dueSoon = filtered.filter(v => v.daysUntilDue > 1 && v.daysUntilDue <= 7);
  const scheduled = filtered.filter(v => v.daysUntilDue > 7);

  const groups = [
    { label: "Overdue", items: overdue },
    { label: "Due Today / Tomorrow", items: dueNow },
    { label: "Due Within 7 Days", items: dueSoon },
    { label: "Upcoming", items: scheduled },
  ].filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {groups.map(group => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-sm font-semibold text-gray-700">{group.label}</h4>
            <span className="text-xs text-gray-400">({group.items.length})</span>
          </div>
          <div className="space-y-2">
            {group.items.map(v => (
              <UpcomingVaccinationCard key={v.id} vaccination={v} onComplete={onComplete} onSkip={onSkip} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
