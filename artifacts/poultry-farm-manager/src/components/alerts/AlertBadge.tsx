import React from "react";

interface AlertBadgeProps {
  count: number;
  hasCritical?: boolean;
}

export default function AlertBadge({ count, hasCritical }: AlertBadgeProps): React.ReactElement | null {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white ${
        hasCritical ? "bg-red-500 animate-pulse" : "bg-red-500"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
