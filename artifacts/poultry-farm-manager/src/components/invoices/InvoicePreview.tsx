import React from "react";
import { formatCurrency, formatDateForDisplay } from "@/lib/utils";
import PaymentStatusBadge from "@/components/sales/PaymentStatusBadge";
import type { SaleDetail } from "@/types/electron";
import type { InvoiceFarmInfo } from "@/lib/invoicePdf";

const UNIT_LABELS: Record<string, string> = { egg: "Eggs", tray: "Tray", peti: "Peti" };
const UNIT_MULTIPLIER: Record<string, number> = { egg: 1, tray: 30, peti: 360 };
const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque",
  mobile_payment: "Mobile Payment", online: "Online", other: "Other",
};

interface Props {
  sale: SaleDetail;
  farm: InvoiceFarmInfo;
}

export default function InvoicePreview({ sale, farm }: Props): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 print:border-0 print:shadow-none print:p-0">
      <div className="border-b-2 border-emerald-600 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-emerald-700">{farm.name}</h1>
        <div className="text-sm text-gray-500 mt-1 space-y-0.5">
          {farm.location && <p>{farm.location}</p>}
          <div className="flex gap-4">
            {farm.phone && <span>Phone: {farm.phone}</span>}
            {farm.email && <span>Email: {farm.email}</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
          <div className="mt-2">
            <PaymentStatusBadge
              status={sale.paymentStatus}
              dueDate={sale.dueDate}
              paidAmount={sale.paidAmount}
              totalAmount={sale.totalAmount}
            />
          </div>
        </div>
        <div className="text-right text-sm space-y-1">
          <p><span className="text-gray-500">Invoice #:</span> <span className="font-medium text-gray-900">{sale.invoiceNumber}</span></p>
          <p><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-900">{formatDateForDisplay(sale.saleDate)}</span></p>
          {sale.dueDate && (
            <p><span className="text-gray-500">Due:</span> <span className="font-medium text-gray-900">{formatDateForDisplay(sale.dueDate)}</span></p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Bill To</p>
        <p className="text-sm font-semibold text-gray-900">{sale.customer.name}</p>
        {sale.customer.businessName && <p className="text-sm text-gray-600">{sale.customer.businessName}</p>}
        {sale.customer.address && <p className="text-sm text-gray-600">{sale.customer.address}</p>}
        {sale.customer.phone && <p className="text-sm text-gray-600">Phone: {sale.customer.phone}</p>}
      </div>

      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="text-left py-2.5 px-3 font-medium">Description</th>
            <th className="text-center py-2.5 px-3 font-medium">Qty</th>
            <th className="text-right py-2.5 px-3 font-medium">Unit Price</th>
            <th className="text-right py-2.5 px-3 font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, i) => (
            <tr key={item.id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
              <td className="py-2 px-3 text-gray-900">
                {(() => {
                  const unitType = (item as any).unitType || (item.itemType === "tray" ? "tray" : "egg");
                  const multiplier = UNIT_MULTIPLIER[unitType] ?? 1;
                  const qty = Number(item.quantity ?? 0);
                  const eggs = Number.isFinite(Number((item as any).totalEggs))
                    ? Number((item as any).totalEggs)
                    : Math.trunc(qty * multiplier);
                  return `${item.grade} — ${qty.toLocaleString()} ${UNIT_LABELS[unitType] || unitType} @ ${formatCurrency(item.unitPrice ?? 0)} (${eggs.toLocaleString()} eggs)`;
                })()}
              </td>
              <td className="py-2 px-3 text-center text-gray-600">{item.quantity ?? 0}</td>
              <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(item.unitPrice ?? 0)}</td>
              <td className="py-2 px-3 text-right font-medium text-gray-900">{formatCurrency(item.lineTotal ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal:</span>
            <span className="text-gray-900">{formatCurrency(sale.subtotal ?? 0)}</span>
          </div>
          {sale.discountAmount && sale.discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Discount{sale.discountType === "percentage" ? ` (${sale.discountValue}%)` : ""}:
              </span>
              <span className="text-emerald-600">-{formatCurrency(sale.discountAmount)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-bold text-gray-900">TOTAL:</span>
            <span className="font-bold text-gray-900 text-lg">{formatCurrency(sale.totalAmount ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Paid:</span>
            <span className="text-emerald-600">{formatCurrency(sale.paidAmount ?? 0)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-bold text-gray-900">BALANCE DUE:</span>
            <span className={`font-bold text-lg ${(sale.balanceDue ?? 0) > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {formatCurrency(sale.balanceDue ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {sale.payments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment History</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-2 px-3 font-medium text-gray-600">Date</th>
                <th className="text-right py-2 px-3 font-medium text-gray-600">Amount</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Method</th>
                <th className="text-left py-2 px-3 font-medium text-gray-600">Reference/Notes</th>
              </tr>
            </thead>
            <tbody>
              {sale.payments.map(p => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-1.5 px-3 text-gray-600">{formatDateForDisplay(p.paymentDate)}</td>
                  <td className="py-1.5 px-3 text-right font-medium text-emerald-600">{formatCurrency(p.amount)}</td>
                  <td className="py-1.5 px-3 text-gray-600">{METHOD_LABELS[p.paymentMethod || ""] || p.paymentMethod || "—"}</td>
                  <td className="py-1.5 px-3 text-gray-500">{p.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sale.notes && (
        <div className="mb-6 text-sm text-gray-500 italic">
          Notes: {sale.notes}
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 text-center">
        <p className="text-sm text-gray-400">Thank you for your business!</p>
      </div>
    </div>
  );
}
