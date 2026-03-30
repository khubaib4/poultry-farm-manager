import React, { useState, useEffect, useRef } from "react";
import { getTodayString } from "@/lib/utils";
import { EXPENSE_CATEGORIES } from "./CategoryIcon";

interface ExpenseFormData {
  category: string;
  amount: string;
  expenseDate: string;
  description: string;
  supplier: string;
  receiptRef: string;
  notes: string;
}

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  suppliers: string[];
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  showSaveAnother?: boolean;
  onSaveAnother?: (data: ExpenseFormData) => Promise<void>;
}

export default function ExpenseForm({
  initialData,
  suppliers,
  onSubmit,
  onCancel,
  submitLabel = "Save Expense",
  showSaveAnother = false,
  onSaveAnother,
}: ExpenseFormProps): React.ReactElement {
  const [form, setForm] = useState<ExpenseFormData>({
    category: initialData?.category || "",
    amount: initialData?.amount || "",
    expenseDate: initialData?.expenseDate || getTodayString(),
    description: initialData?.description || "",
    supplier: initialData?.supplier || "",
    receiptRef: initialData?.receiptRef || "",
    notes: initialData?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const supplierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (supplierRef.current && !supplierRef.current.contains(e.target as Node)) {
        setShowSupplierDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSuppliers = suppliers.filter(s =>
    s.toLowerCase().includes(form.supplier.toLowerCase()) && s.toLowerCase() !== form.supplier.toLowerCase()
  );

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.category) errs.category = "Category is required";
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = "Amount must be a positive number";
    else if (parseFloat(form.amount) > 10000000) errs.amount = "Amount cannot exceed 10,000,000 PKR";
    if (!form.expenseDate) errs.expenseDate = "Date is required";
    else if (form.expenseDate > getTodayString()) errs.expenseDate = "Date cannot be in the future";
    if (!form.description.trim()) errs.description = "Description is required";
    else if (form.description.trim().length < 3) errs.description = "Description must be at least 3 characters";
    else if (form.description.trim().length > 200) errs.description = "Description cannot exceed 200 characters";
    return errs;
  }

  async function handleSubmit(saveAnother: boolean) {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      if (saveAnother && onSaveAnother) {
        await onSaveAnother(form);
      } else {
        await onSubmit(form);
      }
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : "Failed to save expense" });
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field: keyof ExpenseFormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
  }

  return (
    <div className="space-y-5">
      {errors._form && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errors._form}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
        <select
          value={form.category}
          onChange={e => updateField("category", e.target.value)}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.category ? "border-red-300 bg-red-50" : "border-gray-300"}`}
        >
          <option value="">Select a category</option>
          {EXPENSE_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (PKR) *</label>
          <input
            type="number"
            min="1"
            max="10000000"
            step="0.01"
            value={form.amount}
            onChange={e => updateField("amount", e.target.value)}
            placeholder="0.00"
            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.amount ? "border-red-300 bg-red-50" : "border-gray-300"}`}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Expense Date *</label>
          <input
            type="date"
            value={form.expenseDate}
            max={getTodayString()}
            onChange={e => updateField("expenseDate", e.target.value)}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.expenseDate ? "border-red-300 bg-red-50" : "border-gray-300"}`}
          />
          {errors.expenseDate && <p className="text-red-500 text-xs mt-1">{errors.expenseDate}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
        <input
          type="text"
          value={form.description}
          onChange={e => updateField("description", e.target.value)}
          placeholder="e.g., 50kg bag of layer feed"
          maxLength={200}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 ${errors.description ? "border-red-300 bg-red-50" : "border-gray-300"}`}
        />
        <div className="flex justify-between mt-1">
          {errors.description ? <p className="text-red-500 text-xs">{errors.description}</p> : <span />}
          <span className="text-xs text-gray-400">{form.description.length}/200</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div ref={supplierRef} className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Supplier/Vendor</label>
          <input
            type="text"
            value={form.supplier}
            onChange={e => { updateField("supplier", e.target.value); setShowSupplierDropdown(true); }}
            onFocus={() => setShowSupplierDropdown(true)}
            placeholder="e.g., Local Feed Store"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          {showSupplierDropdown && filteredSuppliers.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredSuppliers.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { updateField("supplier", s); setShowSupplierDropdown(false); }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Receipt/Invoice Ref</label>
          <input
            type="text"
            value={form.receiptRef}
            onChange={e => updateField("receiptRef", e.target.value)}
            placeholder="e.g., INV-2024-001"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={e => updateField("notes", e.target.value)}
          placeholder="Additional notes..."
          rows={3}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="px-5 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Saving..." : submitLabel}
        </button>
        {showSaveAnother && onSaveAnother && (
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="px-5 py-2.5 bg-green-100 text-green-700 text-sm font-medium rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
          >
            Save & Add Another
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
