import React from "react";
import { Calendar, Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import PaymentMethodBadge from "./PaymentMethodBadge";
import type { SalePayment, CustomerPayment } from "@/types/electron";

interface Props {
  payments: (SalePayment | CustomerPayment)[];
  showInvoice?: boolean;
}

export default function PaymentHistoryTable({ payments, showInvoice = false }: Props): React.ReactElement {
  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No payments recorded yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Date</th>
            {showInvoice && <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Invoice</th>}
            <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Amount</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Method</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Notes</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-900">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </span>
                </div>
              </td>
              {showInvoice && (
                <td className="py-2.5 px-3 font-mono text-xs text-gray-600">
                  {"invoiceNumber" in p ? (p as CustomerPayment).invoiceNumber : "—"}
                </td>
              )}
              <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                {formatCurrency(p.amount)}
              </td>
              <td className="py-2.5 px-3">
                <PaymentMethodBadge method={p.paymentMethod} />
              </td>
              <td className="py-2.5 px-3 text-gray-500 max-w-[200px] truncate">
                {p.notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
