import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ProfitLossCardProps {
  profit: number;
  margin: number;
}

export default function ProfitLossCard({ profit, margin }: ProfitLossCardProps): React.ReactElement {
  const isProfit = profit > 0;
  const isLoss = profit < 0;

  return (
    <div className={`rounded-xl border-2 p-5 ${isProfit ? "bg-green-50 border-green-200" : isLoss ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isProfit ? "text-green-700" : isLoss ? "text-red-700" : "text-gray-600"}`}>
          Net {isLoss ? "Loss" : "Profit"}
        </span>
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isProfit ? "bg-green-100" : isLoss ? "bg-red-100" : "bg-gray-100"}`}>
          {isProfit ? <TrendingUp className="h-5 w-5 text-green-600" /> : isLoss ? <TrendingDown className="h-5 w-5 text-red-600" /> : <Minus className="h-5 w-5 text-gray-500" />}
        </div>
      </div>
      <p className={`text-2xl font-bold ${isProfit ? "text-green-700" : isLoss ? "text-red-700" : "text-gray-700"}`}>
        {isProfit ? "+" : isLoss ? "-" : ""}{formatCurrency(Math.abs(profit))}
      </p>
      <p className={`text-sm mt-1 ${isProfit ? "text-green-600" : isLoss ? "text-red-600" : "text-gray-500"}`}>
        {margin.toFixed(1)}% margin
      </p>
    </div>
  );
}
