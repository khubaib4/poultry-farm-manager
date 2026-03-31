import React from "react";
import { formatCurrency } from "@/lib/utils";

interface SaleSummaryCardProps {
  subtotal: number;
  discountAmount: number;
  total: number;
  amountPaid?: number;
  balanceDue?: number;
}

export default function SaleSummaryCard({
  subtotal,
  discountAmount,
  total,
  amountPaid,
  balanceDue,
}: SaleSummaryCardProps): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Summary</h3>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-gray-900 text-base">{formatCurrency(total)}</span>
        </div>

        {amountPaid != null && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-medium text-emerald-600">{formatCurrency(amountPaid)}</span>
          </div>
        )}

        {balanceDue != null && (
          <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
            <span className="font-semibold text-gray-900">Balance Due</span>
            <span className={`font-bold text-base ${balanceDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
