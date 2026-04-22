import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron } from "@/lib/api";
import { useSales } from "@/hooks/useSales";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, X, ShoppingCart, DollarSign, CreditCard, AlertTriangle, FileDown } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import SalesTable from "@/components/sales/SalesTable";
import { useFarmId } from "@/hooks/useFarmId";
import SalesExportModal from "@/components/sales/SalesExportModal";

export default function SalesPage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmId = useFarmId();
  const { sales, summary, isLoading, error, filters, setFilters } = useSales(farmId);
  const [searchInput, setSearchInput] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Sales"
        subtitle={`${sales.length} sale${sales.length !== 1 ? "s" : ""}`}
        icon={<ShoppingCart className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => navigate("/farm/sales/new")}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Sale
            </button>
          </div>
        }
      />

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalSales)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalReceived)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalOutstanding)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingCart className="h-4 w-4 text-gray-500" />
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Count</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.salesCount}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice # or customer..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <input
          type="date"
          value={filters.startDate || ""}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        />
        <input
          type="date"
          value={filters.endDate || ""}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        />

        <select
          value={filters.paymentStatus || "all"}
          onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value === "all" ? undefined : e.target.value })}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner size="lg" text="Loading sales..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : sales.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-8 w-8" />}
          title="No sales yet"
          description="Record your first sale to start tracking invoices and payments."
          actionLabel="New Sale"
          onAction={() => navigate("/farm/sales/new")}
        />
      ) : (
        <SalesTable sales={sales} />
      )}

      {showExportModal && farmId != null && (
        <SalesExportModal
          farmId={farmId}
          initialFilters={{
            startDate: filters.startDate || "",
            endDate: filters.endDate || "",
            paymentStatus: (filters.paymentStatus as any) || "all",
            search: filters.search || searchInput || "",
          }}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
