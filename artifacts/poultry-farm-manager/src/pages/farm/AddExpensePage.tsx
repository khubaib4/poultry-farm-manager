import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, expenses as expensesApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { getTodayString } from "@/lib/utils";

export default function AddExpensePage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = user?.farmId ?? null;

  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (farmId) {
      expensesApi.getSuppliers(farmId).then(setSuppliers).catch(() => {});
    }
  }, [farmId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSubmit(data: { category: string; amount: string; expenseDate: string; description: string; supplier: string; receiptRef: string; notes: string }) {
    if (!farmId) return;
    await expensesApi.create({
      farmId,
      category: data.category,
      amount: parseFloat(data.amount),
      expenseDate: data.expenseDate,
      description: data.description.trim(),
      supplier: data.supplier.trim() || undefined,
      receiptRef: data.receiptRef.trim() || undefined,
      notes: data.notes.trim() || undefined,
    });
    navigate("/farm/expenses");
  }

  async function handleSaveAnother(data: { category: string; amount: string; expenseDate: string; description: string; supplier: string; receiptRef: string; notes: string }) {
    if (!farmId) return;
    await expensesApi.create({
      farmId,
      category: data.category,
      amount: parseFloat(data.amount),
      expenseDate: data.expenseDate,
      description: data.description.trim(),
      supplier: data.supplier.trim() || undefined,
      receiptRef: data.receiptRef.trim() || undefined,
      notes: data.notes.trim() || undefined,
    });
    setToast({ type: "success", message: "Expense saved! Add another one." });
    setFormKey(prev => prev + 1);
    expensesApi.getSuppliers(farmId).then(setSuppliers).catch(() => {});
  }

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          This feature is only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium bg-green-50 text-green-800 border border-green-200">
          {toast.message}
        </div>
      )}

      <button
        onClick={() => navigate("/farm/expenses")}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Expenses
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Add Expense</h1>
        <p className="text-sm text-gray-500 mb-6">Record a new farm expense</p>

        <ExpenseForm
          key={formKey}
          suppliers={suppliers}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/farm/expenses")}
          submitLabel="Save Expense"
          showSaveAnother={true}
          onSaveAnother={handleSaveAnother}
        />
      </div>
    </div>
  );
}
