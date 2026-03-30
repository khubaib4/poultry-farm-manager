import React from "react";
import { DollarSign, Egg, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RevenueSummaryCardsProps {
  totalRevenue: number;
  totalEggs: number;
  avgPricePerEgg: number;
  profit: number;
}

export default function RevenueSummaryCards({ totalRevenue, totalEggs, avgPricePerEgg, profit }: RevenueSummaryCardsProps): React.ReactElement {
  const cards = [
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenue),
      icon: <DollarSign className="h-5 w-5" />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      label: "Total Eggs",
      value: totalEggs.toLocaleString(),
      icon: <Egg className="h-5 w-5" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Avg Price/Egg",
      value: `PKR ${avgPricePerEgg.toFixed(2)}`,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      label: "Profit/Loss",
      value: formatCurrency(Math.abs(profit)),
      icon: profit >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />,
      color: profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : "text-gray-600",
      bg: profit > 0 ? "bg-green-50" : profit < 0 ? "bg-red-50" : "bg-gray-50",
      border: profit > 0 ? "border-green-200" : profit < 0 ? "border-red-200" : "border-gray-200",
      prefix: profit > 0 ? "+" : profit < 0 ? "-" : "",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">{card.label}</span>
            <div className={`h-9 w-9 rounded-lg ${card.bg} ${card.color} flex items-center justify-center`}>
              {card.icon}
            </div>
          </div>
          <p className={`text-xl font-bold ${card.color}`}>
            {"prefix" in card && card.prefix}{card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
