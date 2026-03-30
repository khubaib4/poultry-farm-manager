import React from "react";
import { Bird, Egg, DollarSign, Receipt, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PerBirdMetrics, PerEggMetrics } from "@/types/electron";

interface QuickStatsGridProps {
  perBird: PerBirdMetrics | null;
  perEgg: PerEggMetrics | null;
}

export default function QuickStatsGrid({ perBird, perEgg }: QuickStatsGridProps): React.ReactElement {
  const stats = [
    {
      label: "Revenue / Bird",
      value: formatCurrency(perBird?.revenuePerBird ?? 0),
      icon: <Bird className="h-4 w-4" />,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Expense / Bird",
      value: formatCurrency(perBird?.expensePerBird ?? 0),
      icon: <Receipt className="h-4 w-4" />,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Profit / Bird",
      value: formatCurrency(Math.abs(perBird?.profitPerBird ?? 0)),
      prefix: (perBird?.profitPerBird ?? 0) >= 0 ? "+" : "-",
      icon: (perBird?.profitPerBird ?? 0) >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />,
      color: (perBird?.profitPerBird ?? 0) >= 0 ? "text-green-600" : "text-red-600",
      bg: (perBird?.profitPerBird ?? 0) >= 0 ? "bg-green-50" : "bg-red-50",
    },
    {
      label: "Cost / Egg",
      value: `PKR ${(perEgg?.costPerEgg ?? 0).toFixed(2)}`,
      icon: <Egg className="h-4 w-4" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Revenue / Egg",
      value: `PKR ${(perEgg?.revenuePerEgg ?? 0).toFixed(2)}`,
      icon: <DollarSign className="h-4 w-4" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Current Birds",
      value: (perBird?.avgBirds ?? 0).toLocaleString(),
      icon: <Bird className="h-4 w-4" />,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-lg p-3`}>
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`${stat.color}`}>{stat.icon}</div>
              <span className="text-xs text-gray-500">{stat.label}</span>
            </div>
            <p className={`text-sm font-bold ${stat.color}`}>
              {"prefix" in stat && stat.prefix}{stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
