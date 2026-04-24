import React, { useEffect, useMemo, useState } from "react";
import { X, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { customerBalance as customerBalanceApi } from "@/lib/api";
import { formatCurrency, getTodayString } from "@/lib/utils";
import BankTransferFields from "@/components/shared/BankTransferFields";
import ChequeFields from "@/components/shared/ChequeFields";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "online", label: "Online / JazzCash" },
  { value: "other", label: "Other" },
];

interface Props {
  farmId: number;
  customerId: number;
  customerName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdvancePaymentModal({
  farmId,
  customerId,
  customerName,
  onClose,
  onSuccess,
}: Props): React.ReactElement {
  const { showToast } = useToast();

  const today = useMemo(() => getTodayString(), []);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [fromBank, setFromBank] = useState("");
  const [toBank, setToBank] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const parsedAmount = Number(amount);
  const isValid = Number.isFinite(parsedAmount) && parsedAmount > 0 && Boolean(date) && Boolean(paymentMethod);

  useEffect(() => {
    if (paymentMethod !== "bank_transfer") {
      setFromBank("");
      setToBank("");
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (paymentMethod === "cheque") {
      setChequeDate((d) => d || today);
      return;
    }
    setChequeNumber("");
    setChequeDate("");
    setChequeBank("");
  }, [paymentMethod, today]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || saving) return;
    try {
      setSaving(true);
      const bankNote =
        paymentMethod === "bank_transfer" && (fromBank || toBank)
          ? `Bank Transfer: From ${fromBank || "—"} → To ${toBank || "—"}`
          : "";
      const chequeNote =
        paymentMethod === "cheque" && (chequeNumber || chequeDate || chequeBank)
          ? [
              chequeNumber ? `Cheque #${chequeNumber}` : "",
              chequeBank ? `Bank: ${chequeBank}` : "",
              chequeDate ? `Cash Date: ${chequeDate}` : "",
            ]
              .filter(Boolean)
              .join(" | ")
          : "";
      const combinedNotes = [notes.trim(), bankNote, chequeNote].filter(Boolean).join("\n") || undefined;
      await customerBalanceApi.recordAdvancePayment({
        farmId,
        customerId,
        amount: parsedAmount,
        paymentMethod,
        date,
        notes: combinedNotes,
      });
      showToast(`Advance payment of ${formatCurrency(parsedAmount)} recorded`, "success");
      onClose();
      onSuccess();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to record advance payment", "error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Record Advance Payment</h2>
            <p className="text-xs text-gray-500 mt-0.5">Record a payment received in advance from {customerName}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (PKR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">PKR</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {paymentMethod === "bank_transfer" && (
            <BankTransferFields
              fromBank={fromBank}
              toBank={toBank}
              onFromBankChange={setFromBank}
              onToBankChange={setToBank}
            />
          )}

          {paymentMethod === "cheque" && (
            <ChequeFields
              chequeNumber={chequeNumber}
              chequeDate={chequeDate}
              chequeBank={chequeBank}
              onChequeNumberChange={setChequeNumber}
              onChequeDateChange={setChequeDate}
              onChequeBankChange={setChequeBank}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional details..."
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
              <Wallet className="h-4 w-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

