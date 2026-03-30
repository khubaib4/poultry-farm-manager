import React, { useState } from "react";
import { Calculator } from "lucide-react";
import { formatCurrency, calculateEggRevenue } from "@/lib/utils";

interface EggPriceRecord {
  pricePerEgg: number;
}

interface RevenueCalculatorProps {
  prices: Record<string, EggPriceRecord | null>;
}

export default function RevenueCalculator({ prices }: RevenueCalculatorProps): React.ReactElement {
  const [eggsA, setEggsA] = useState("");
  const [eggsB, setEggsB] = useState("");
  const [eggsCracked, setEggsCracked] = useState("");

  const priceA = prices.A?.pricePerEgg ?? 0;
  const priceB = prices.B?.pricePerEgg ?? 0;
  const priceCracked = prices.cracked?.pricePerEgg ?? 0;

  const result = calculateEggRevenue(
    parseInt(eggsA) || 0, parseInt(eggsB) || 0, parseInt(eggsCracked) || 0,
    priceA, priceB, priceCracked
  );

  const hasPrices = priceA > 0 || priceB > 0 || priceCracked > 0;

  if (!hasPrices) return <></>;

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-5 py-4 border-b">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-gray-500" />
          Revenue Calculator
        </h3>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade A Eggs</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={eggsA}
              onChange={e => setEggsA(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            {parseInt(eggsA) > 0 && priceA > 0 && (
              <p className="text-xs text-gray-500 mt-1">= {formatCurrency(result.revenueA)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade B Eggs</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={eggsB}
              onChange={e => setEggsB(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            {parseInt(eggsB) > 0 && priceB > 0 && (
              <p className="text-xs text-gray-500 mt-1">= {formatCurrency(result.revenueB)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cracked Eggs</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={eggsCracked}
              onChange={e => setEggsCracked(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
            {parseInt(eggsCracked) > 0 && priceCracked > 0 && (
              <p className="text-xs text-gray-500 mt-1">= {formatCurrency(result.revenueCracked)}</p>
            )}
          </div>
        </div>
        {result.total > 0 && (
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Estimated Revenue</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(result.total)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
