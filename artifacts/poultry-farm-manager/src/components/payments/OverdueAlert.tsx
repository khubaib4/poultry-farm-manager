import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  count: number;
  totalAmount: number;
}

export default function OverdueAlert({ count, totalAmount }: Props): React.ReactElement | null {
  const navigate = useNavigate();

  if (count === 0) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-800">
            {count} Overdue {count === 1 ? "Payment" : "Payments"}
          </p>
          <p className="text-xs text-red-600">
            Total overdue: {formatCurrency(totalAmount)}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate("/farm/receivables")}
        className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
      >
        View Receivables
      </button>
    </div>
  );
}
