import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentAlert } from "@/types/electron";

interface Props {
  customerId: number;
  alerts: PaymentAlert[];
  totalOutstanding: number;
}

export default function CustomerPaymentAlert({ customerId, alerts, totalOutstanding }: Props): React.ReactElement | null {
  const navigate = useNavigate();

  if (alerts.length === 0) return null;

  const overdueAlerts = alerts.filter(a => a.type === "overdue");
  const dueSoonAlerts = alerts.filter(a => a.type !== "overdue");
  const hasOverdue = overdueAlerts.length > 0;
  const overdueTotal = overdueAlerts.reduce((s, a) => s + a.balanceDue, 0);

  const bgColor = hasOverdue ? "bg-red-50" : "bg-yellow-50";
  const borderColor = hasOverdue ? "border-red-200" : "border-yellow-200";
  const textColor = hasOverdue ? "text-red-800" : "text-yellow-800";
  const subTextColor = hasOverdue ? "text-red-600" : "text-yellow-600";
  const iconBg = hasOverdue ? "bg-red-100" : "bg-yellow-100";
  const iconColor = hasOverdue ? "text-red-600" : "text-yellow-600";
  const Icon = hasOverdue ? AlertCircle : Clock;

  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${textColor}`}>
            {hasOverdue
              ? `${overdueAlerts.length} Overdue Payment${overdueAlerts.length > 1 ? "s" : ""}`
              : `${dueSoonAlerts.length} Payment${dueSoonAlerts.length > 1 ? "s" : ""} Due Soon`
            }
          </p>
          <p className={`text-xs ${subTextColor} mt-0.5`}>
            {hasOverdue
              ? `Overdue: ${formatCurrency(overdueTotal)}`
              : `Upcoming: ${formatCurrency(totalOutstanding)}`
            }
            {" — "}Total Outstanding: {formatCurrency(totalOutstanding)}
          </p>
          {alerts.length <= 3 && (
            <div className="mt-2 space-y-1">
              {alerts.map(a => (
                <button
                  key={a.saleId}
                  onClick={() => navigate(`/farm/sales/${a.saleId}`)}
                  className={`block text-xs ${subTextColor} hover:underline`}
                >
                  {a.invoiceNumber}: {formatCurrency(a.balanceDue)}
                  {a.type === "overdue" ? ` (${a.daysOverdue}d overdue)` : a.type === "due_today" ? " (today)" : ` (in ${a.daysTillDue}d)`}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => navigate(`/farm/receivables`)}
          className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
            hasOverdue
              ? "text-red-700 bg-red-100 hover:bg-red-200"
              : "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
          }`}
        >
          <CreditCard className="h-3 w-3" />
          View
        </button>
      </div>
    </div>
  );
}
