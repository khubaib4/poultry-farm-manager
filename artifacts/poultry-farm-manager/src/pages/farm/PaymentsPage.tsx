import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isElectron, payments as paymentsApi } from "@/lib/api";
import { usePayments } from "@/hooks/usePayments";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign, Calendar, Search, X, Eye, Trash2,
  Banknote, AlertTriangle, Clock, TrendingUp,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import PaymentMethodBadge from "@/components/payments/PaymentMethodBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { PaymentWithDetails } from "@/types/electron";

const PAYMENT_METHODS = [
  { value: "", label: "All Methods" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "mobile_payment", label: "Mobile Payment" },
  { value: "other", label: "Other" },
];

export default function PaymentsPage(): React.ReactElement {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { payments, summary, isLoading, filters, setFilters, refresh } = usePayments();

  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PaymentWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature requires the desktop application.</div>;
  }

  function handleSearch() {
    setFilters({ ...filters, search: searchInput.trim() || undefined });
  }

  function clearSearch() {
    setSearchInput("");
    setFilters({ ...filters, search: undefined });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const paymentAmount = deleteTarget.amount;
    try {
      setIsDeleting(true);
      await paymentsApi.delete(deleteTarget.id);
      setDeleteTarget(null);
      setIsDeleting(false);
      showToast(`Payment of ${formatCurrency(paymentAmount)} deleted`, "success");
      refresh();
    } catch (err) {
      setDeleteTarget(null);
      setIsDeleting(false);
      showToast(err instanceof Error ? err.message : "Failed to delete payment", "error");
    }
  }

  if (isLoading) return <LoadingSpinner size="lg" text="Loading payments..." />;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Payments"
        icon={<DollarSign className="h-6 w-6" />}
        actions={
          <button
            onClick={() => navigate("/farm/receivables")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            <Clock className="h-4 w-4" />
            View Receivables
          </button>
        }
      />

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Banknote className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-gray-500">Payments Today</p>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.paymentsToday)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium text-gray-500">Pending Receivables</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalReceivables)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs font-medium text-gray-500">Overdue Amount</p>
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.overdueAmount)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <p className="text-xs font-medium text-gray-500">Due This Week</p>
            </div>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(summary.dueThisWeek)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by invoice or customer..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchInput && (
              <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={e => setFilters({ ...filters, startDate: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={e => setFilters({ ...filters, endDate: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            placeholder="To"
          />
          <select
            value={filters.paymentMethod || ""}
            onChange={e => setFilters({ ...filters, paymentMethod: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          >
            {PAYMENT_METHODS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No payments found</p>
            <p className="text-gray-400 text-xs mt-1">Record payments from the Sales or Receivables page</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Invoice #</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Method</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Notes</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-gray-900">{new Date(p.paymentDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{p.customerName}</p>
                      {p.customerBusinessName && (
                        <p className="text-xs text-gray-500">{p.customerBusinessName}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{p.invoiceNumber}</td>
                    <td className="py-3 px-4 text-right font-semibold text-emerald-600">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4">
                      <PaymentMethodBadge method={p.paymentMethod} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate">{p.notes || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/farm/sales/${p.saleId}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Sale"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Payment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Payment"
        message={deleteTarget ? `Delete payment of ${formatCurrency(deleteTarget.amount)} for ${deleteTarget.invoiceNumber}? This will recalculate the sale's balance.` : ""}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
