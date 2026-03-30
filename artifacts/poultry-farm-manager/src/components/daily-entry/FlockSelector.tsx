import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Circle, Bird } from "lucide-react";

interface FlockInfo {
  id: number;
  batchName: string;
  breed?: string | null;
  currentCount: number;
  status?: string | null;
  hasEntry: boolean;
}

interface FlockSelectorProps {
  flocks: FlockInfo[];
  selectedFlockId: number | null;
  onSelect: (flockId: number) => void;
}

export default function FlockSelector({ flocks, selectedFlockId, onSelect }: FlockSelectorProps): React.ReactElement {
  const activeFlocks = flocks.filter(f => f.status === "active");
  const completedCount = activeFlocks.filter(f => f.hasEntry).length;

  if (activeFlocks.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <Bird className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No active flocks found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">Select Flock</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {completedCount}/{activeFlocks.length} complete
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFlocks.map(flock => (
          <button
            key={flock.id}
            onClick={() => onSelect(flock.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
              selectedFlockId === flock.id
                ? "border-green-600 bg-green-50 text-green-800 ring-1 ring-green-600"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {flock.hasEntry ? (
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
            <span className="truncate max-w-[140px]">{flock.batchName}</span>
            <span className="text-xs text-gray-400">({flock.currentCount})</span>
          </button>
        ))}
      </div>
    </div>
  );
}
