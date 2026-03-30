import { useState } from "react";
import type { FlockVaccinationItem } from "@/types/electron";

interface Props {
  vaccinations: FlockVaccinationItem[];
  onSelect?: (v: FlockVaccinationItem) => void;
}

function getStatusColor(status: string | null, scheduledDate: string) {
  const today = new Date().toISOString().split("T")[0];
  if (status === "completed") return { bg: "bg-green-500", border: "border-green-500", text: "text-green-700", label: "Completed" };
  if (status === "skipped") return { bg: "bg-red-500", border: "border-red-500", text: "text-red-700", label: "Skipped" };
  if (status === "pending" && scheduledDate < today) return { bg: "bg-orange-500", border: "border-orange-500", text: "text-orange-700", label: "Overdue" };
  return { bg: "bg-gray-400", border: "border-gray-400", text: "text-gray-600", label: "Pending" };
}

export default function VaccinationTimeline({ vaccinations, onSelect }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (vaccinations.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No vaccinations scheduled for this flock.
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
      {vaccinations.map((v) => {
        const color = getStatusColor(v.status, v.scheduledDate);
        const isExpanded = expandedId === v.id;

        return (
          <div key={v.id} className="relative mb-6 last:mb-0">
            <div
              className={`absolute left-[-21px] top-1 w-4 h-4 rounded-full ${color.bg} border-2 border-white ring-2 ${color.border} cursor-pointer`}
              onClick={() => {
                setExpandedId(isExpanded ? null : v.id);
                onSelect?.(v);
              }}
            />
            <div
              className={`ml-2 p-3 rounded-lg border cursor-pointer transition-all ${
                isExpanded ? "border-blue-300 bg-blue-50/50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => {
                setExpandedId(isExpanded ? null : v.id);
                onSelect?.(v);
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{v.vaccineName}</span>
                  <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                    color.bg === "bg-green-500" ? "bg-green-100 text-green-700" :
                    color.bg === "bg-red-500" ? "bg-red-100 text-red-700" :
                    color.bg === "bg-orange-500" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {color.label}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Day {v.vaccAgeDays}
                </div>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {v.status === "completed" && v.administeredDate
                  ? `Administered: ${v.administeredDate}`
                  : `Scheduled: ${v.scheduledDate}`
                }
              </div>
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-1">
                  {v.administeredBy && (
                    <div className="text-gray-600">
                      <span className="font-medium">By:</span> {v.administeredBy}
                    </div>
                  )}
                  {v.batchNumber && (
                    <div className="text-gray-600">
                      <span className="font-medium">Batch #:</span> {v.batchNumber}
                    </div>
                  )}
                  {v.notes && (
                    <div className="text-gray-600">
                      <span className="font-medium">Notes:</span> {v.notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
