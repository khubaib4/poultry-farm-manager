import React from "react";
import { useNavigate } from "react-router-dom";
import { Bird, CheckCircle2, Circle } from "lucide-react";

interface FlockMiniCardProps {
  id: number;
  batchName: string;
  breed?: string | null;
  currentCount: number;
  arrivalDate: string;
  ageAtArrivalDays: number;
  hasEntryToday: boolean;
}

function calculateAge(arrivalDate: string, ageAtArrivalDays: number): number {
  const arrival = new Date(arrivalDate);
  const now = new Date();
  const daysSinceArrival = Math.floor((now.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceArrival + ageAtArrivalDays;
}

function formatAge(days: number): string {
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 7)}w`;
}

export default function FlockMiniCard({ id, batchName, breed, currentCount, arrivalDate, ageAtArrivalDays, hasEntryToday }: FlockMiniCardProps): React.ReactElement {
  const navigate = useNavigate();
  const ageDays = calculateAge(arrivalDate, ageAtArrivalDays);

  return (
    <button
      onClick={() => navigate(`/farm/flocks/${id}`)}
      className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-primary/50 hover:shadow-sm transition-all text-left w-full"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0">
        <Bird className="h-4 w-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{batchName}</p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{currentCount.toLocaleString()} birds</span>
          <span className="text-gray-300">&middot;</span>
          <span>{formatAge(ageDays)} old</span>
          {breed && (
            <>
              <span className="text-gray-300">&middot;</span>
              <span className="truncate">{breed}</span>
            </>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {hasEntryToday ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-300" />
        )}
      </div>
    </button>
  );
}
