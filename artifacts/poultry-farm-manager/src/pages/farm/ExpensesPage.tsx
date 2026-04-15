import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, expenses as expensesApi } from "@/lib/api";
import { formatCurrency, getTodayString } from "@/lib/utils";
import { Plus, Search, X } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import ExpenseSummaryCard from "@/components/expenses/ExpenseSummaryCard";
import { EXPENSE_CATEGORIES } from "@/components/expenses/CategoryIcon";
import { useFarmId } from "@/hooks/useFarmId";

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

interface Summary {
  total: number;
  byCategory: Record<string, number>;
  count: number;
}

function getMonthStart(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getMonthEnd(): string {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return last.toISOString().split("T")[0];
}

export default function ExpensesPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = useFarmId();

  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, byCategory: {}, count: 0 });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(getMonthStart());
  const [endDate, setEndDate] = useState(getMonthEnd());
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      if (category) filters.category = category;
      if (search.trim()) filters.search = search.trim();

      const [list, sum] = await Promise.all([
        expensesApi.getByFarm(farmId, filters),
        expensesApi.getSummary(farmId, startDate, endDate),
      ]);
      setExpensesList(list as Expense[]);
      setSummary(sum);
    } catch {
      setExpensesList([]);
      setSummary({ total: 0, byCategory: {}, count: 0 });
    } finally {
      setLoading(false);
    }
  }, [farmId, startDate, endDate, category, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleDelete() {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await expensesApi.delete(deleteModal.id);
      setToast({ type: "success", message: "Expense deleted successfully" });
      setDeleteModal(null);
      fetchData();
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to delete" });
    } finally {
      setDeleting(false);
    }
  }

  if (!isElectron()) {
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          Expenses are only available in the desktop app.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${toast.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage farm spending</p>
        </div>
        <button
          onClick={() => navigate("/farm/expenses/new")}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      <ExpenseSummaryCard total={summary.total} byCategory={summary.byCategory} count={summary.count} />

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search description..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          {(category || search) && (
            <button
              onClick={() => { setCategory(""); setSearch(""); }}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading expenses..." />
      ) : expensesList.length === 0 && !category && !search ? (
        <div className="bg-white rounded-xl border border-gray-200">
          <EmptyState
            icon={<Plus className="h-8 w-8" />}
            title="No expenses recorded"
            description="No expenses recorded. Track your farm expenses here."
            actionLabel="Add Expense"
            onAction={() => navigate("/farm/expenses/new")}
          />
        </div>
      ) : (
        <ExpenseTable
          expenses={expensesList}
          onEdit={id => navigate(`/farm/expenses/${id}/edit`)}
          onDelete={expense => setDeleteModal(expense)}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteModal}
        title="Delete Expense"
        message={deleteModal ? `Are you sure you want to delete "${deleteModal.description}" (${formatCurrency(deleteModal.amount)})?` : ""}
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(null)}
        isLoading={deleting}
      />
    </div>
  );
}
