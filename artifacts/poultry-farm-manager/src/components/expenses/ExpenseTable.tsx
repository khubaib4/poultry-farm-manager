import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency, formatDateForDisplay } from "@/lib/utils";
import CategoryIcon, { getCategoryLabel } from "./CategoryIcon";

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  supplier?: string | null;
  receiptRef?: string | null;
}

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (id: number) => void;
  onDelete: (expense: Expense) => void;
}

export default function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps): React.ReactElement {
  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-lg mb-1">No expenses found</p>
        <p className="text-gray-400 text-sm">Try adjusting your filters or add a new expense.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {formatDateForDisplay(expense.expenseDate)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={expense.category} size="sm" />
                    <span className="text-sm text-gray-700">{getCategoryLabel(expense.category)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">{expense.description}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{expense.supplier || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(expense.id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(expense)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden divide-y divide-gray-100">
        {expenses.map(expense => (
          <div key={expense.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <CategoryIcon category={expense.category} size="md" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{expense.description}</p>
                  <p className="text-xs text-gray-500">{getCategoryLabel(expense.category)}</p>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatDateForDisplay(expense.expenseDate)}</span>
                {expense.supplier && <span>• {expense.supplier}</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(expense.id)} className="p-1.5 text-gray-400 hover:text-green-600 rounded">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(expense)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
