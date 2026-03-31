import React, { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { sales as salesApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "mobile_payment", label: "Mobile Payment (JazzCash, Easypaisa)" },
  { value: "other", label: "Other" },
];

interface Props {
  saleId: number;
  balanceDue: number;
  customerName: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecordPaymentModal({
  saleId, balanceDue, customerName, invoiceNumber, totalAmount, paidAmount,
  onClose, onSuccess,
}: Props): React.ReactElement {
  const { showToast } = useToast();
  const today = new Date().toISOString().split("T")[0];

  const [amount, setAmount] = useState(String(balanceDue));
  const [paymentDate, setPaymentDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const parsedAmount = parseFloat(amount) || 0;
  const remainingAfter = Math.max(0, Math.round((balanceDue - parsedAmount) * 100) / 100);
  const isValid = parsedAmount > 0 && parsedAmount <= balanceDue && paymentDate && paymentMethod;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || saving) return;
    try {
      setSaving(true);
      await salesApi.recordPayment({
        saleId,
        amount: parsedAmount,
        paymentDate,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      onClose();
      onSuccess();
      showToast(
        remainingAfter === 0
          ? `Payment of ${formatCurrency(parsedAmount)} recorded — Invoice fully paid!`
          : `Payment of ${formatCurrency(parsedAmount)} recorded — ${formatCurrency(remainingAfter)} remaining`,
        "success"
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to record payment", "error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
            <p className="text-xs text-gray-500 mt-0.5">{customerName} — {invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">Invoice Total</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Already Paid</p>
              <p className="text-sm font-semibold text-emerald-600">{formatCurrency(paidAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Balance Due</p>
              <p className="text-sm font-semibold text-red-600">{formatCurrency(balanceDue)}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">PKR</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceDue}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
            {parsedAmount > balanceDue && (
              <p className="text-xs text-red-600 mt-1">Amount cannot exceed balance due</p>
            )}
            {parsedAmount > 0 && parsedAmount <= balanceDue && (
              <p className="text-xs text-gray-500 mt-1">
                After payment: {remainingAfter === 0 ? "Fully paid" : `${formatCurrency(remainingAfter)} remaining`}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reference number, cheque number, etc."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
