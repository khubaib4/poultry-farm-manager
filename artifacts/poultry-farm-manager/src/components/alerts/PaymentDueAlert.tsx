import React from "react";
import { useNavigate } from "react-router-dom";
import { Clock, CreditCard } from "lucide-react";
import { formatCurrency, formatDateForDisplay } from "@/lib/utils";

interface Props {
  customerName: string;
  invoiceNumber: string;
  saleId: number;
  amount: number;
  dueDate: string;
}

export default function PaymentDueAlert({ customerName, invoiceNumber, saleId, amount, dueDate }: Props): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
          <Clock className="h-4 w-4 text-orange-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-orange-800 truncate">
            {customerName} — {invoiceNumber}
          </p>
          <p className="text-xs text-orange-600">
            {formatCurrency(amount)} due {formatDateForDisplay(dueDate)}
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate(`/farm/sales/${saleId}`)}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors shrink-0"
      >
        <CreditCard className="h-3 w-3" />
        Pay
      </button>
    </div>
  );
}
