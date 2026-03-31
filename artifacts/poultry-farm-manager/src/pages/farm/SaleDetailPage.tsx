import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isElectron, sales as salesApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, formatDateForDisplay } from "@/lib/utils";
import { ArrowLeft, Edit2, Trash2, DollarSign, FileText } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorState from "@/components/ui/ErrorState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PaymentStatusBadge from "@/components/sales/PaymentStatusBadge";
import SaleSummaryCard from "@/components/sales/SaleSummaryCard";
import type { SaleDetail } from "@/types/electron";

const ITEM_TYPE_LABELS: Record<string, string> = { egg: "Eggs", tray: "Trays" };
const GRADE_LABELS: Record<string, string> = { A: "Grade A", B: "Grade B", cracked: "Cracked" };
const METHOD_LABELS: Record<string, string> = {
  cash: "Cash", bank_transfer: "Bank Transfer", cheque: "Cheque", online: "Online", other: "Other",
};

export default function SaleDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  async function loadSale() {
    if (!id || !isElectron()) { setIsLoading(false); return; }
    try {
      setIsLoading(true);
      setError(null);
      const data = await salesApi.getById(parseInt(id, 10));
      setSale(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sale");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadSale(); }, [id]);

  async function handleDelete() {
    if (!sale) return;
    try {
      setIsDeleting(true);
      await salesApi.delete(sale.id);
      showToast("Sale deleted successfully", "success");
      navigate("/farm/sales");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete sale", "error");
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!sale) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) { showToast("Enter a valid payment amount", "error"); return; }
    if (amount > (sale.balanceDue ?? 0) + 0.01) { showToast("Amount exceeds balance due", "error"); return; }

    try {
      setIsRecordingPayment(true);
      await salesApi.recordPayment({
        saleId: sale.id,
        amount,
        paymentDate,
        paymentMethod,
        notes: paymentNotes.trim() || undefined,
      });
      showToast("Payment recorded successfully", "success");
      setShowPayment(false);
      setPaymentAmount("");
      setPaymentNotes("");
      await loadSale();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to record payment", "error");
    } finally {
      setIsRecordingPayment(false);
    }
  }

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  if (isLoading) return <LoadingSpinner size="lg" text="Loading sale..." />;
  if (error || !sale) return <ErrorState message={error || "Sale not found"} onRetry={loadSale} />;

  const hasPayments = sale.payments && sale.payments.length > 0;
  const canEdit = !hasPayments;
  const canDelete = !hasPayments;
  const isPaid = sale.paymentStatus === "paid";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title={sale.invoiceNumber}
        subtitle={`Sale to ${sale.customer?.name || "Unknown"}`}
        icon={<FileText className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/farm/sales")} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {canEdit && (
              <button
                onClick={() => navigate(`/farm/sales/${sale.id}/edit`)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Sale Info</h3>
              <PaymentStatusBadge
                status={sale.paymentStatus}
                dueDate={sale.dueDate}
                paidAmount={sale.paidAmount}
                totalAmount={sale.totalAmount}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium text-gray-900">{sale.customer?.name || "Unknown"}</p>
                {sale.customer?.businessName && <p className="text-xs text-gray-500">{sale.customer.businessName}</p>}
              </div>
              <div>
                <p className="text-gray-500">Sale Date</p>
                <p className="font-medium text-gray-900">{formatDateForDisplay(sale.saleDate)}</p>
              </div>
              <div>
                <p className="text-gray-500">Due Date</p>
                <p className="font-medium text-gray-900">{sale.dueDate ? formatDateForDisplay(sale.dueDate) : "—"}</p>
              </div>
              <div>
                <p className="text-gray-500">Invoice</p>
                <p className="font-medium text-emerald-600">{sale.invoiceNumber}</p>
              </div>
            </div>
            {sale.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-gray-700">{sale.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Items</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sale.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-sm text-gray-900">{ITEM_TYPE_LABELS[item.itemType] || item.itemType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{GRADE_LABELS[item.grade] || item.grade}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-900">{item.quantity?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(item.unitPrice ?? 0)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(item.lineTotal ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Payment History</h3>
              {!isPaid && (
                <button
                  onClick={() => setShowPayment(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <DollarSign className="h-3.5 w-3.5" /> Record Payment
                </button>
              )}
            </div>
            {sale.payments && sale.payments.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sale.payments.map((p, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-gray-900">{formatDateForDisplay(p.paymentDate)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{METHOD_LABELS[p.paymentMethod] || p.paymentMethod}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="px-6 py-8 text-center text-sm text-gray-400">No payments recorded yet.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SaleSummaryCard
            subtotal={sale.subtotal ?? 0}
            discountAmount={sale.discountAmount ?? 0}
            total={sale.totalAmount ?? 0}
            amountPaid={sale.paidAmount ?? 0}
            balanceDue={sale.balanceDue ?? 0}
          />
        </div>
      </div>

      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={sale.balanceDue ?? 0}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${formatCurrency(sale.balanceDue ?? 0)}`}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowPayment(false); setPaymentAmount(""); setPaymentNotes(""); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRecordingPayment}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isRecordingPayment ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDelete}
        title="Delete Sale"
        message={`Are you sure you want to delete invoice ${sale.invoiceNumber}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
