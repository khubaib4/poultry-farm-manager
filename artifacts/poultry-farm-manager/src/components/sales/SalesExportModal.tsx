import React, { useMemo, useState } from "react";
import { X, FileDown } from "lucide-react";
import { profile, sales as salesApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { generateSalesListPDF } from "@/lib/salesPdfExport";
import type { SaleDetail, SaleWithCustomer } from "@/types/electron";

export type SalesExportPaymentStatus = "all" | "paid" | "partial" | "unpaid";
export type SalesExportCustomerType = "all" | "existing" | "walkin";

export interface SalesExportInitialFilters {
  startDate: string;
  endDate: string;
  paymentStatus: SalesExportPaymentStatus;
  search: string;
}

interface Props {
  farmId: number;
  initialFilters: SalesExportInitialFilters;
  onClose: () => void;
}

export default function SalesExportModal({ farmId, initialFilters, onClose }: Props): React.ReactElement {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState(() => ({
    startDate: initialFilters.startDate,
    endDate: initialFilters.endDate,
    status: initialFilters.paymentStatus,
    customerType: "all" as SalesExportCustomerType,
    search: initialFilters.search,
    includeItems: true,
    includePayments: false,
    includeSummary: true,
  }));

  const effectiveSearch = useMemo(() => String(filters.search || "").trim().toLowerCase(), [filters.search]);

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    try {
      const farmProfile = await profile.getFarmProfile().catch(() => null);
      const farmName = farmProfile?.name || "Farm";

      const apiFilters: any = {
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        paymentStatus: filters.status !== "all" ? filters.status : undefined,
        search: effectiveSearch || undefined,
      };

      // Fetch sales using server-side filters whenever possible.
      let rows: SaleWithCustomer[] = await salesApi.getByFarm(farmId, apiFilters);

      // Customer type filter (walk-in vs existing) is client-side.
      if (filters.customerType === "existing") rows = rows.filter((s) => Boolean(s.customerId));
      if (filters.customerType === "walkin") rows = rows.filter((s) => !s.customerId);

      // Ensure search also matches walk-in names (for SQLite it may already be in customerName; for Mongo we also added support).
      if (effectiveSearch) {
        rows = rows.filter((s) =>
          String(s.invoiceNumber ?? "").toLowerCase().includes(effectiveSearch) ||
          String(s.customerName ?? "").toLowerCase().includes(effectiveSearch) ||
          String(s.walkInCustomerName ?? "").toLowerCase().includes(effectiveSearch)
        );
      }

      // Optionally fetch item/payment details per sale.
      let salesWithDetails: Array<SaleWithCustomer | (SaleDetail & { customerName?: string })> = rows;
      if (filters.includeItems || filters.includePayments) {
        const details = await Promise.all(
          rows.map(async (s) => {
            const d = await salesApi.getById(s.id);
            return {
              ...d,
              customerName: s.customerName,
              walkInCustomerName: s.walkInCustomerName,
            };
          })
        );
        salesWithDetails = details;
      }

      const totals = {
        totalSales: salesWithDetails.reduce((sum, s: any) => sum + Number(s.totalAmount ?? 0), 0),
        totalPaid: salesWithDetails.reduce((sum, s: any) => sum + Number(s.paidAmount ?? 0), 0),
        totalOutstanding: 0,
        salesCount: salesWithDetails.length,
        paidCount: salesWithDetails.filter((s: any) => s.paymentStatus === "paid").length,
        unpaidCount: salesWithDetails.filter((s: any) => s.paymentStatus === "unpaid").length,
        partialCount: salesWithDetails.filter((s: any) => s.paymentStatus === "partial").length,
      };
      totals.totalOutstanding = Math.max(0, totals.totalSales - totals.totalPaid);

      await generateSalesListPDF({
        farmName,
        sales: salesWithDetails as any[],
        totals,
        filters: {
          startDate: filters.startDate || "",
          endDate: filters.endDate || "",
          status: filters.status,
          customerType: filters.customerType,
          includeItems: filters.includeItems,
          includePayments: filters.includePayments,
          includeSummary: filters.includeSummary,
          search: filters.search || "",
        },
      });

      toast.success("Sales PDF exported");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Export Sales Report</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as SalesExportPaymentStatus }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid Only</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Customer Type</label>
            <select
              value={filters.customerType}
              onChange={(e) => setFilters((prev) => ({ ...prev, customerType: e.target.value as SalesExportCustomerType }))}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Customers</option>
              <option value="existing">Existing Customers Only</option>
              <option value="walkin">Walk-in Customers Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Search (invoice/customer)</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Invoice # or customer name"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeSummary}
                onChange={(e) => setFilters((prev) => ({ ...prev, includeSummary: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Include Summary Statistics</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includeItems}
                onChange={(e) => setFilters((prev) => ({ ...prev, includeItems: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Include Item Details (per invoice)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.includePayments}
                onChange={(e) => setFilters((prev) => ({ ...prev, includePayments: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Include Payment History (per invoice)</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            type="button"
          >
            <FileDown className="w-4 h-4" />
            {loading ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

