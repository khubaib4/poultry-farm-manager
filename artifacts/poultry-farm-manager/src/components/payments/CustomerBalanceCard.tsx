import React from "react";
import { DollarSign, ShoppingCart, Clock, History } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  totalPurchases: number;
  totalPaid: number;
  balanceDue: number;
  onRecordPayment?: () => void;
  onViewHistory?: () => void;
}

export default function CustomerBalanceCard({
  totalPurchases, totalPaid, balanceDue, onRecordPayment, onViewHistory,
}: Props): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Balance Summary</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">Total Purchases</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalPurchases)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-gray-600">Total Paid</span>
          </div>
          <span className="text-sm font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-gray-900">Balance Due</span>
            </div>
            <span className={`text-lg font-bold ${balanceDue > 0 ? "text-red-600" : "text-gray-900"}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>
      </div>
      {(onRecordPayment || onViewHistory) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          {onRecordPayment && balanceDue > 0 && (
            <button
              onClick={onRecordPayment}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <DollarSign className="h-3.5 w-3.5" />
              Record Payment
            </button>
          )}
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <History className="h-3.5 w-3.5" />
              View History
            </button>
          )}
        </div>
      )}
    </div>
  );
}
