import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, customers as customersApi } from "@/lib/api";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/components/ui/Toast";
import { Plus, Search, X, LayoutGrid, List, Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CustomerCard from "@/components/customers/CustomerCard";
import CustomerTable from "@/components/customers/CustomerTable";
import { CUSTOMER_CATEGORIES } from "@/components/customers/CategoryBadge";
import type { Customer } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";

export default function CustomersPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const farmId = useFarmId();
  const { customers, isLoading, filters, setFilters, refresh } = useCustomers(farmId);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchInput, setSearchInput] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  function handleSearch(value: string) {
    setSearchInput(value);
    setFilters({ ...filters, search: value || undefined });
  }

  function clearSearch() {
    setSearchInput("");
    setFilters({ ...filters, search: undefined });
  }

  async function handleDeletePermanently() {
    if (!deleteTarget) return;
    const customerName = deleteTarget.name;
    try {
      setIsDeleting(true);
      await customersApi.deletePermanently(deleteTarget.id);
      setDeleteTarget(null);
      setIsDeleting(false);
      showToast(`${customerName} deleted permanently`, "success");
      refresh();
    } catch (err) {
      setDeleteTarget(null);
      setIsDeleting(false);
      showToast(err instanceof Error ? err.message : "Failed to delete customer", "error");
    }
  }

  const activeCount = customers.filter(c => c.isActive === 1).length;
  const totalCount = customers.length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Customers"
        subtitle={`${totalCount} customer${totalCount !== 1 ? "s" : ""}`}
        icon={<Users className="h-6 w-6" />}
        actions={
          <button
            onClick={() => navigate("/farm/customers/new")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Customer
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Customers</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Inactive</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{totalCount - activeCount}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, business..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <select
          value={filters.category || "all"}
          onChange={(e) => setFilters({ ...filters, category: e.target.value === "all" ? undefined : e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          <option value="all">All Categories</option>
          {CUSTOMER_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <select
          value={filters.status || "active"}
          onChange={(e) => setFilters({ ...filters, status: e.target.value as "active" | "inactive" | "all" })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 ${viewMode === "table" ? "bg-emerald-50 text-emerald-600" : "text-gray-400 hover:text-gray-600"}`}
            title="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" text="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No customers yet"
          description="Add your first customer to start tracking buyers and their purchases."
          actionLabel="Add Customer"
          onAction={() => navigate("/farm/customers/new")}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <CustomerCard key={c.id} customer={c} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <CustomerTable customers={customers} onDelete={setDeleteTarget} />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Customer Permanently"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This will also remove all their deleted sales records. This action cannot be undone.`}
        confirmText="Delete Permanently"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeletePermanently}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
