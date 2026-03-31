import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Eye, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { ReceivableItem } from "@/types/electron";

interface Props {
  receivables: ReceivableItem[];
  onRecordPayment: (item: ReceivableItem) => void;
}

export default function ReceivablesTable({ receivables, onRecordPayment }: Props): React.ReactElement {
  const navigate = useNavigate();

  if (receivables.length === 0) {
    return (
      <div className="text-center py-12">
        <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No outstanding receivables</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Customer</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Invoice #</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Sale Date</th>
            <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Due Date</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">Total</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">Paid</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">Balance</th>
            <th className="text-center py-3 px-3 text-xs font-medium text-gray-500">Status</th>
            <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody>
          {receivables.map((r) => (
            <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 ${r.isOverdue ? "bg-red-50/50" : ""}`}>
              <td className="py-2.5 px-3">
                <div>
                  <p className="font-medium text-gray-900">{r.customerName}</p>
                  {r.customerBusinessName && (
                    <p className="text-xs text-gray-500">{r.customerBusinessName}</p>
                  )}
                </div>
              </td>
              <td className="py-2.5 px-3 font-mono text-xs text-gray-600">{r.invoiceNumber}</td>
              <td className="py-2.5 px-3 text-gray-600">
                {new Date(r.saleDate).toLocaleDateString()}
              </td>
              <td className="py-2.5 px-3">
                {r.dueDate ? (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className={r.isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                      {new Date(r.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right text-gray-900">{formatCurrency(r.totalAmount)}</td>
              <td className="py-2.5 px-3 text-right text-emerald-600">{formatCurrency(r.paidAmount)}</td>
              <td className="py-2.5 px-3 text-right font-semibold text-red-600">{formatCurrency(r.balanceDue)}</td>
              <td className="py-2.5 px-3 text-center">
                {r.isOverdue ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                    <AlertTriangle className="h-3 w-3" />
                    {r.daysOverdue}d overdue
                  </span>
                ) : r.isDueSoon ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                    <Clock className="h-3 w-3" />
                    Due soon
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    Outstanding
                  </span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onRecordPayment(r)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="Record Payment"
                  >
                    <DollarSign className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/farm/sales/${r.id}`)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Sale"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
