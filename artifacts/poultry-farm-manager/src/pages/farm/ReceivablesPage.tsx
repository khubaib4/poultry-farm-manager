import React, { useState } from "react";
import { isElectron } from "@/lib/api";
import { useReceivables } from "@/hooks/useReceivables";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign, AlertTriangle, Clock, Calendar, TrendingUp,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ReceivablesTable from "@/components/payments/ReceivablesTable";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import type { ReceivableItem } from "@/types/electron";

const TABS = [
  { key: undefined as string | undefined, label: "All Outstanding" },
  { key: "overdue", label: "Overdue" },
  { key: "due_soon", label: "Due Soon" },
];

export default function ReceivablesPage(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const { receivables, summary, isLoading, refresh } = useReceivables(activeTab);
  const [paymentTarget, setPaymentTarget] = useState<ReceivableItem | null>(null);

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature requires the desktop application.</div>;
  }

  if (isLoading) return <LoadingSpinner size="lg" text="Loading receivables..." />;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Receivables"
        icon={<TrendingUp className="h-6 w-6" />}
      />
      <p className="text-sm text-gray-500 -mt-4 mb-6">Money owed to you by customers</p>

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium text-gray-500">Total Receivables</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.totalReceivables)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs font-medium text-gray-500">Overdue</p>
            </div>
            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.overdueAmount)}</p>
            {summary.overdueCount > 0 && (
              <p className="text-xs text-red-500 mt-0.5">{summary.overdueCount} invoice{summary.overdueCount !== 1 ? "s" : ""}</p>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <p className="text-xs font-medium text-gray-500">Due This Week</p>
            </div>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(summary.dueThisWeek)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <p className="text-xs font-medium text-gray-500">Due This Month</p>
            </div>
            <p className="text-xl font-bold text-gray-700">{formatCurrency(summary.dueThisMonth)}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-4">
          <div className="flex gap-0">
            {TABS.map(tab => (
              <button
                key={tab.key ?? "all"}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ReceivablesTable
          receivables={receivables}
          onRecordPayment={(item) => setPaymentTarget(item)}
        />
      </div>

      {paymentTarget && (
        <RecordPaymentModal
          saleId={paymentTarget.id}
          balanceDue={paymentTarget.balanceDue}
          customerName={paymentTarget.customerName}
          invoiceNumber={paymentTarget.invoiceNumber}
          totalAmount={paymentTarget.totalAmount}
          paidAmount={paymentTarget.paidAmount}
          onClose={() => setPaymentTarget(null)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
