import React from "react";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface EggPriceRecord {
  id: number;
  grade: string;
  pricePerEgg: number;
  pricePerTray: number;
  effectiveDate: string;
}

interface CurrentPricesCardProps {
  prices: Record<string, EggPriceRecord | null>;
  onUpdate?: () => void;
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

const gradeLabels: Record<string, string> = { A: "Grade A", B: "Grade B", cracked: "Cracked" };
const gradeColors: Record<string, string> = {
  A: "bg-green-50 border-green-200",
  B: "bg-blue-50 border-blue-200",
  cracked: "bg-amber-50 border-amber-200",
};

export default function CurrentPricesCard({ prices, onUpdate }: CurrentPricesCardProps): React.ReactElement {
  const hasPrices = Object.values(prices).some(p => p !== null);
  const effectiveDate = Object.values(prices).find(p => p)?.effectiveDate;
  const stale = effectiveDate ? daysSince(effectiveDate) > 30 : false;

  if (!hasPrices) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8 text-center">
        <p className="text-gray-500 mb-3">No egg prices configured yet.</p>
        {onUpdate && (
          <button onClick={onUpdate} className="text-primary font-medium hover:underline">
            Set Prices Now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-5 py-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-semibold">Current Prices</h3>
        <div className="flex items-center gap-2">
          {stale && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <AlertTriangle className="h-3 w-3" />
              Outdated ({daysSince(effectiveDate!)} days)
            </span>
          )}
          {effectiveDate && (
            <span className="text-sm text-gray-500">
              Since {new Date(effectiveDate + "T00:00:00").toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["A", "B", "cracked"] as const).map(grade => {
            const p = prices[grade];
            return (
              <div key={grade} className={`rounded-lg border p-4 ${gradeColors[grade]}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{gradeLabels[grade]}</h4>
                  {grade === "A" && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">Primary</span>
                  )}
                </div>
                {p ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Per Egg</span>
                      <span className="font-medium text-gray-900">{formatCurrency(p.pricePerEgg)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Per Tray (30)</span>
                      <span className="font-medium text-gray-900">{formatCurrency(p.pricePerTray)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Not set</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
