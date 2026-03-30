import React from "react";

interface StockStatusBadgeProps {
  quantity: number;
  threshold: number | null;
  expiryDate: string | null;
}

export type StockStatus = "ok" | "low" | "out" | "expired";

export function getStockStatus(quantity: number, threshold: number | null, expiryDate: string | null): StockStatus {
  if (expiryDate) {
    const today = new Date().toISOString().split("T")[0];
    if (expiryDate <= today) return "expired";
  }
  if (quantity <= 0) return "out";
  if (threshold !== null && quantity <= threshold) return "low";
  return "ok";
}

const STATUS_CONFIG: Record<StockStatus, { label: string; bg: string; text: string }> = {
  ok: { label: "OK", bg: "bg-green-100", text: "text-green-700" },
  low: { label: "Low Stock", bg: "bg-amber-100", text: "text-amber-700" },
  out: { label: "Out of Stock", bg: "bg-red-100", text: "text-red-700" },
  expired: { label: "Expired", bg: "bg-red-100", text: "text-red-700" },
};

export default function StockStatusBadge({ quantity, threshold, expiryDate }: StockStatusBadgeProps): React.ReactElement {
  const status = getStockStatus(quantity, threshold, expiryDate);
  const config = STATUS_CONFIG[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
