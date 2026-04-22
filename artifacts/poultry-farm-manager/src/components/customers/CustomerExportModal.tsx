import React, { useMemo, useState } from "react";
import { X, FileDown } from "lucide-react";
import { sales as salesApi, payments as paymentsApi } from "@/lib/api";
import {
  generateCustomerPDF,
  type CustomerInvoiceFilter,
  type CustomerPaymentRow,
  type CustomerSaleRow,
} from "@/lib/customerPdfExport";
import type { CustomerPayment, Sale } from "@/types/electron";

interface Props {
  customerId: number;
  customerName: string;
  onClose: () => void;
}

export default function CustomerExportModal({ customerId, customerName, onClose }: Props): React.ReactElement {
  const [filter, setFilter] = useState<CustomerInvoiceFilter>("all");
  const [includePayments, setIncludePayments] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => `Export: ${customerName}`, [customerName]);

  async function handleExport() {
    setLoading(true);
    try {
      const allSales = await salesApi.getByCustomer(customerId);
      let filteredSales = (allSales ?? []) as Sale[];

      if (filter !== "all") {
        filteredSales = filteredSales.filter((s) => s.paymentStatus === filter);
      }

      if (dateRange.start) {
        filteredSales = filteredSales.filter((s) => (s.saleDate || "") >= dateRange.start);
      }
      if (dateRange.end) {
        filteredSales = filteredSales.filter((s) => (s.saleDate || "") <= dateRange.end);
      }

      const saleIdSet = new Set(filteredSales.map((s) => s.id));

      let customerPayments: CustomerPayment[] = [];
      if (includePayments) {
        const allCustomerPayments = await paymentsApi.getByCustomer(customerId);
        customerPayments = (allCustomerPayments ?? []).filter((p) => saleIdSet.has(p.saleId));
      }

      const totals = {
        totalPurchases: filteredSales.reduce((sum, s) => sum + Number(s.totalAmount ?? 0), 0),
        totalPaid: includePayments
          ? customerPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
          : filteredSales.reduce((sum, s) => sum + Number(s.paidAmount ?? 0), 0),
        balanceDue: 0,
      };
      totals.balanceDue = Math.max(0, totals.totalPurchases - totals.totalPaid);

      const salesRows: CustomerSaleRow[] = filteredSales.map((s) => ({
        id: s.id,
        invoiceNumber: s.invoiceNumber,
        saleDate: s.saleDate,
        totalAmount: s.totalAmount,
        paidAmount: s.paidAmount,
        paymentStatus: s.paymentStatus,
      }));

      const paymentRows: CustomerPaymentRow[] = customerPayments.map((p) => ({
        paymentDate: p.paymentDate,
        invoiceNumber: p.invoiceNumber,
        paymentMethod: p.paymentMethod,
        amount: p.amount,
        notes: null,
      }));

      await generateCustomerPDF({
        customerName,
        customerId,
        sales: salesRows,
        payments: paymentRows,
        totals,
        filter,
        dateRange,
        includePayments,
        includeSummary,
      });

      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Export failed:", error);
      alert("Failed to export PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">Export Customer Report</h2>
            <p className="text-xs text-gray-500 truncate">{title}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Invoice Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as CustomerInvoiceFilter)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="all">All Invoices</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
              <option value="partial">Partially Paid</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Include Summary</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includePayments}
                onChange={(e) => setIncludePayments(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Include Payment Details</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {loading ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

