import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Clock, Calendar, DollarSign, ChevronDown, ChevronUp, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PaymentAlert } from "@/types/electron";

interface Props {
  alerts: PaymentAlert[];
  maxItems?: number;
  showHeader?: boolean;
}

const alertConfig: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string; badge: string }> = {
  overdue: {
    icon: <AlertCircle className="h-4 w-4" />,
    bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700",
  },
  due_today: {
    icon: <Clock className="h-4 w-4" />,
    bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-700",
  },
  due_soon: {
    icon: <Calendar className="h-4 w-4" />,
    bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700",
  },
};

function formatAlertMessage(alert: PaymentAlert): string {
  if (alert.type === "overdue") {
    return `${alert.customerName} — ${alert.invoiceNumber} overdue by ${alert.daysOverdue} day${alert.daysOverdue !== 1 ? "s" : ""} (${formatCurrency(alert.balanceDue)})`;
  }
  if (alert.type === "due_today") {
    return `${alert.customerName} — ${alert.invoiceNumber} due today (${formatCurrency(alert.balanceDue)})`;
  }
  return `${alert.customerName} — ${alert.invoiceNumber} due in ${alert.daysTillDue} day${alert.daysTillDue !== 1 ? "s" : ""} (${formatCurrency(alert.balanceDue)})`;
}

export default function PaymentAlerts({ alerts, maxItems = 5, showHeader = true }: Props): React.ReactElement {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  if (alerts.length === 0) return <></>;

  const displayed = alerts.slice(0, maxItems);
  const remaining = alerts.length - displayed.length;
  const overdueCount = alerts.filter(a => a.type === "overdue").length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {showHeader && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Payment Alerts</h3>
            <div className="flex gap-1.5">
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                  {overdueCount} overdue
                </span>
              )}
              {alerts.length - overdueCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  {alerts.length - overdueCount} upcoming
                </span>
              )}
            </div>
          </div>
          {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
      )}
      {(expanded || !showHeader) && (
        <div className={`${showHeader ? "px-5 pb-4" : "p-4"} space-y-2`}>
          {displayed.map(alert => {
            const config = alertConfig[alert.type];
            return (
              <div
                key={`${alert.type}-${alert.saleId}`}
                className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border} cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => navigate(`/farm/sales/${alert.saleId}`)}
              >
                <span className={`mt-0.5 shrink-0 ${config.text}`}>{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${config.text}`}>{formatAlertMessage(alert)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/farm/sales/${alert.saleId}`); }}
                  className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${config.badge} hover:opacity-80`}
                >
                  <CreditCard className="h-3 w-3" />
                  Pay
                </button>
              </div>
            );
          })}
          {remaining > 0 && (
            <button
              onClick={() => navigate("/farm/receivables")}
              className="w-full text-center text-sm text-emerald-600 font-medium hover:text-emerald-700 py-2"
            >
              +{remaining} more — View All Receivables
            </button>
          )}
        </div>
      )}
    </div>
  );
}
