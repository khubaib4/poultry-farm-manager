import React from "react";

interface PaymentStatusBadgeProps {
  status: string | null;
  dueDate?: string | null;
  paidAmount?: number | null;
  totalAmount?: number | null;
}

export default function PaymentStatusBadge({
  status,
  dueDate,
  paidAmount,
  totalAmount,
}: PaymentStatusBadgeProps): React.ReactElement {
  const isOverdue = dueDate && status !== "paid" && dueDate < new Date().toISOString().split("T")[0];
  const paidPercent = totalAmount && totalAmount > 0 && paidAmount != null
    ? Math.round((paidAmount / totalAmount) * 100)
    : 0;

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Overdue
      </span>
    );
  }

  if (status === "paid") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
        Paid
      </span>
    );
  }

  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        Partial ({paidPercent}%)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Unpaid
    </span>
  );
}
