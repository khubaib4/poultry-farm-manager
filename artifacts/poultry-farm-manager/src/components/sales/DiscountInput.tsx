import React from "react";
import { formatCurrency } from "@/lib/utils";

interface DiscountInputProps {
  discountType: "none" | "percentage" | "fixed";
  discountValue: string;
  discountAmount: number;
  onTypeChange: (type: "none" | "percentage" | "fixed") => void;
  onValueChange: (value: string) => void;
}

export default function DiscountInput({
  discountType,
  discountValue,
  discountAmount,
  onTypeChange,
  onValueChange,
}: DiscountInputProps): React.ReactElement {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Discount</label>
      <div className="flex items-center gap-3">
        <select
          value={discountType}
          onChange={(e) => onTypeChange(e.target.value as "none" | "percentage" | "fixed")}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          <option value="none">No Discount</option>
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount</option>
        </select>

        {discountType !== "none" && (
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              step={discountType === "percentage" ? "1" : "0.01"}
              max={discountType === "percentage" ? "100" : undefined}
              value={discountValue}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={discountType === "percentage" ? "Enter %" : "Enter amount"}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            {discountType === "percentage" && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            )}
          </div>
        )}
      </div>

      {discountType !== "none" && discountAmount > 0 && (
        <p className="text-sm text-gray-500">
          Discount: <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
        </p>
      )}
    </div>
  );
}
