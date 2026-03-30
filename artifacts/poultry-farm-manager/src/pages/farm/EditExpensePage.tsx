import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, expenses as expensesApi } from "@/lib/api";
import { ArrowLeft, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import ExpenseForm from "@/components/expenses/ExpenseForm";

interface Expense {
  id: number;
  farmId: number;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  supplier?: string | null;
  receiptRef?: string | null;
  notes?: string | null;
}

export default function EditExpensePage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { expenseId } = useParams<{ expenseId: string }>();
  const farmId = user?.farmId ?? null;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!expenseId || !farmId) return;
      setLoading(true);
      try {
        const [exp, sups] = await Promise.all([
          expensesApi.getById(parseInt(expenseId, 10)),
          expensesApi.getSuppliers(farmId),
        ]);
        setExpense(exp as Expense);
        setSuppliers(sups);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load expense");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [expenseId, farmId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSubmit(data: { category: string; amount: string; expenseDate: string; description: string; supplier: string; receiptRef: string; notes: string }) {
    if (!expenseId) return;
    await expensesApi.update(parseInt(expenseId, 10), {
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

  async function handleDelete() {
    if (!expenseId) return;
    setDeleting(true);
    try {
      await expensesApi.delete(parseInt(expenseId, 10));
      navigate("/farm/expenses");
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delete" });
      setDeleteModal(false);
    } finally {
      setDeleting(false);
    }
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

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {error || "Expense not found"}
        </div>
        <button onClick={() => navigate("/farm/expenses")} className="mt-4 text-sm text-green-600 hover:text-green-700">
          Back to Expenses
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate("/farm/expenses")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Expenses
        </button>
        <button
          onClick={() => setDeleteModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Expense</h1>
        <p className="text-sm text-gray-500 mb-6">Update expense details</p>

        <ExpenseForm
          initialData={{
            category: expense.category,
            amount: String(expense.amount),
            expenseDate: expense.expenseDate,
            description: expense.description,
            supplier: expense.supplier || "",
            receiptRef: expense.receiptRef || "",
            notes: expense.notes || "",
          }}
          suppliers={suppliers}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/farm/expenses")}
          submitLabel="Update Expense"
        />
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Expense</h3>
            <p className="text-sm text-gray-600 mb-1">Are you sure you want to delete this expense?</p>
            <p className="text-sm font-medium text-gray-800 mb-1">{expense.description}</p>
            <p className="text-sm text-gray-600 mb-4">{formatCurrency(expense.amount)}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
