import React from "react";
import { ShoppingCart, Users, CheckCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ProfitLossData } from "@/types/electron";

interface QuickStatsGridProps {
  revenue: ProfitLossData["revenue"] | null;
}

export default function QuickStatsGrid({ revenue }: QuickStatsGridProps): React.ReactElement {
  const avgSale = revenue && revenue.salesCount > 0
    ? revenue.total / revenue.salesCount
    : 0;

  const stats = [
    {
      label: "Avg Sale Value",
      value: formatCurrency(avgSale),
      icon: <ShoppingCart className="h-4 w-4" />,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Customers Served",
      value: String(revenue?.customersServed ?? 0),
      icon: <Users className="h-4 w-4" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Collection Rate",
      value: `${(revenue?.collectionRate ?? 0).toFixed(1)}%`,
      icon: <CheckCircle className="h-4 w-4" />,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Outstanding",
      value: formatCurrency(revenue?.outstanding ?? 0),
      icon: <AlertCircle className="h-4 w-4" />,
      color: (revenue?.outstanding ?? 0) > 0 ? "text-amber-600" : "text-green-600",
      bg: (revenue?.outstanding ?? 0) > 0 ? "bg-amber-50" : "bg-green-50",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`${stat.color}`}>{stat.icon}</div>
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`text-sm font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
