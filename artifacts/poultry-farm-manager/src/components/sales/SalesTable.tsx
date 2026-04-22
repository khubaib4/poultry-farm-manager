import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";
import { formatCurrency, formatDateForDisplay } from "@/lib/utils";
import PaymentStatusBadge from "./PaymentStatusBadge";
import DownloadInvoiceButton from "@/components/invoices/DownloadInvoiceButton";
import type { SaleWithCustomer } from "@/types/electron";

interface SalesTableProps {
  sales: SaleWithCustomer[];
}

export default function SalesTable({ sales }: SalesTableProps): React.ReactElement {
  const navigate = useNavigate();

  function getCustomerDisplayName(sale: SaleWithCustomer): string {
    if (sale.customerId && sale.customerName) return sale.customerName;
    if (sale.walkInCustomerName && sale.walkInCustomerName.trim()) return `${sale.walkInCustomerName.trim()} (Walk-in)`;
    return "Walk-in Customer";
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.map((sale) => (
              <tr
                key={sale.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/farm/sales/${sale.id}`)}
              >
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-emerald-600">{sale.invoiceNumber}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDateForDisplay(sale.saleDate)}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getCustomerDisplayName(sale)}</p>
                    {sale.customerBusinessName && (
                      <p className="text-xs text-gray-500">{sale.customerBusinessName}</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(sale.totalAmount ?? 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right text-emerald-600">
                  {formatCurrency(sale.paidAmount ?? 0)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  <span className={(sale.balanceDue ?? 0) > 0 ? "text-red-600" : "text-gray-900"}>
                    {formatCurrency(sale.balanceDue ?? 0)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <PaymentStatusBadge
                    status={sale.paymentStatus}
                    dueDate={sale.dueDate}
                    paidAmount={sale.paidAmount}
                    totalAmount={sale.totalAmount}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/farm/sales/${sale.id}`); }}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"
                      title="View sale"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <DownloadInvoiceButton
                      saleId={sale.id}
                      invoiceNumber={sale.invoiceNumber}
                      customerName={getCustomerDisplayName(sale)}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
