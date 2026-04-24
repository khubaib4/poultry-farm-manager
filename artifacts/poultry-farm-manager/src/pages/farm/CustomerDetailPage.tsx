import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isElectron, customers as customersApi, payments as paymentsApi, receivables as receivablesApi, alerts as alertsApi, customerBalance as customerBalanceApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import {
  Users, Edit, Phone, MapPin, Building2, CreditCard, Clock,
  DollarSign, ShoppingCart, CalendarDays, FileDown,
  Wallet, SlidersHorizontal,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CategoryBadge from "@/components/customers/CategoryBadge";
import PaymentHistoryTable from "@/components/payments/PaymentHistoryTable";
import RecordPaymentModal from "@/components/payments/RecordPaymentModal";
import CustomerPaymentAlert from "@/components/alerts/CustomerPaymentAlert";
import CustomerExportModal from "@/components/customers/CustomerExportModal";
import AdvancePaymentModal from "@/components/customers/AdvancePaymentModal";
import BalanceAdjustmentModal from "@/components/customers/BalanceAdjustmentModal";
import type { CustomerWithStats, CustomerPayment, ReceivableItem, PaymentAlert, CustomerBalanceTransaction } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";

function getPaymentTermsLabel(days: number | null): string {
  if (days === null || days === 0) return "Cash on Delivery";
  return `${days} Days Credit`;
}

export default function CustomerDetailPage(): React.ReactElement {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const id = Number(customerId);
  const farmId = useFarmId();

  const [customer, setCustomer] = useState<CustomerWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<ReceivableItem[]>([]);
  const [paymentTarget, setPaymentTarget] = useState<ReceivableItem | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "payments" | "outstanding" | "balance">("overview");
  const [customerAlerts, setCustomerAlerts] = useState<PaymentAlert[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [balanceTxs, setBalanceTxs] = useState<CustomerBalanceTransaction[]>([]);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);

  async function loadData() {
    if (!isElectron() || !id) return;
    try {
      const [data, payments, outstanding] = await Promise.all([
        customersApi.getById(id),
        paymentsApi.getByCustomer(id),
        receivablesApi.getByCustomer(id),
      ]);
      setCustomer(data);
      setCustomerPayments(payments);
      setOutstandingInvoices(outstanding);

      if (farmId) {
        alertsApi.getPaymentAlerts(farmId)
          .then(all => setCustomerAlerts(all.filter(a => a.customerId === id)))
          .catch(() => {});
      }
    } catch (err) {
      showToast("Failed to load customer details", "error");
      navigate("/farm/customers");
    } finally {
      setLoading(false);
    }
  }

  async function loadBalance() {
    if (!isElectron() || !id) return;
    try {
      setBalanceLoading(true);
      const [b, txs] = await Promise.all([
        customerBalanceApi.getBalance(id),
        customerBalanceApi.getTransactions(id),
      ]);
      setCreditBalance(Number((b as any)?.balance ?? 0));
      setBalanceTxs((txs as any) || []);
    } catch {
      setCreditBalance(0);
      setBalanceTxs([]);
    } finally {
      setBalanceLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    loadBalance();
  }, [id, farmId]);

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading customer..." />;

  if (!customer) return <div className="p-6 text-center text-gray-500">Customer not found.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title={customer.name}
        backTo="/farm/customers"
        icon={<Users className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            {customer.stats.balanceDue > 0 && outstandingInvoices.length > 0 && (
              <button
                onClick={() => setPaymentTarget(outstandingInvoices[0])}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                Record Payment
              </button>
            )}
            <button
              onClick={() => setShowAdvanceModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              Record Advance Payment
            </button>
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Balance Adjustment"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Adjust
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FileDown className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => navigate(`/farm/customers/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <CategoryBadge category={customer.category} size="md" />
        {customer.isActive === 0 && (
          <span className="inline-flex items-center px-2.5 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">
            Inactive
          </span>
        )}
      </div>

      {customerAlerts.length > 0 && (
        <div className="mb-6">
          <CustomerPaymentAlert
            customerId={id}
            alerts={customerAlerts}
            totalOutstanding={customer.stats.balanceDue}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            {customer.phone && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{customer.phone}</p>
                </div>
              </div>
            )}
            {customer.businessName && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Business</p>
                  <p className="text-sm font-medium text-gray-900">{customer.businessName}</p>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{customer.address}</p>
                </div>
              </div>
            )}
            {!customer.phone && !customer.businessName && !customer.address && (
              <p className="text-sm text-gray-400">No contact details provided.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment & Pricing</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Payment Terms</p>
                <p className="text-sm font-medium text-gray-900">
                  {getPaymentTermsLabel(customer.paymentTermsDays)}
                </p>
              </div>
            </div>
            {customer.defaultPricePerEgg != null && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Price per Egg</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(customer.defaultPricePerEgg)}
                  </p>
                </div>
              </div>
            )}
            {customer.defaultPricePerTray != null && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Price per Tray</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(customer.defaultPricePerTray)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            <p className="text-xs font-medium text-gray-500">Total Purchases</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(customer.stats.totalPurchases)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium text-gray-500">Total Paid</p>
          </div>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(customer.stats.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-red-500" />
            <p className="text-xs font-medium text-gray-500">Balance Due</p>
          </div>
          <p className={`text-xl font-bold ${customer.stats.balanceDue > 0 ? "text-red-600" : "text-gray-900"}`}>
            {formatCurrency(customer.stats.balanceDue)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <p className="text-xs font-medium text-gray-500">Credit Balance</p>
          </div>
          {balanceLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <p
              className={`text-xl font-bold ${
                (creditBalance ?? 0) > 0 ? "text-emerald-600" : (creditBalance ?? 0) === 0 ? "text-gray-500" : "text-red-600"
              }`}
            >
              {formatCurrency(creditBalance ?? 0)}
            </p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-gray-500" />
            <p className="text-xs font-medium text-gray-500">Last Purchase</p>
          </div>
          <p className="text-sm font-bold text-gray-900">
            {customer.stats.lastPurchaseDate || "No purchases yet"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="border-b border-gray-200 px-4">
          <div className="flex gap-0">
            {([
              { key: "overview" as const, label: "Overview" },
              { key: "payments" as const, label: `Payments (${customerPayments.length})` },
              { key: "outstanding" as const, label: `Outstanding (${outstandingInvoices.length})` },
              { key: "balance" as const, label: `Balance (${balanceTxs.length})` },
            ]).map(tab => (
              <button
                key={tab.key}
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

        <div className="p-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              {customer.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Customer Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Customer ID</p>
                    <p className="font-medium text-gray-900">#{customer.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Added On</p>
                    <p className="font-medium text-gray-900">
                      {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Orders</p>
                    <p className="font-medium text-gray-900">{customer.stats.totalOrders}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payments" && (
            <PaymentHistoryTable payments={customerPayments} showInvoice />
          )}

          {activeTab === "outstanding" && (
            <div>
              {outstandingInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No outstanding invoices</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {outstandingInvoices.map(inv => (
                    <div
                      key={inv.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        inv.isOverdue ? "border-red-200 bg-red-50" : "border-gray-200"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(inv.saleDate).toLocaleDateString()}
                          {inv.dueDate && ` — Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
                          {inv.isOverdue && (
                            <span className="text-red-600 font-medium ml-1">({inv.daysOverdue}d overdue)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-600">{formatCurrency(inv.balanceDue)}</p>
                          <p className="text-xs text-gray-500">of {formatCurrency(inv.totalAmount)}</p>
                        </div>
                        <button
                          onClick={() => setPaymentTarget(inv)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "balance" && (
            <div>
              {balanceTxs.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No balance transactions yet</p>
                </div>
              ) : (
                <BalanceHistoryTable transactions={balanceTxs} />
              )}
            </div>
          )}
        </div>
      </div>

      {paymentTarget && (
        <RecordPaymentModal
          saleId={paymentTarget.id}
          balanceDue={paymentTarget.balanceDue}
          customerName={customer.name}
          invoiceNumber={paymentTarget.invoiceNumber}
          totalAmount={paymentTarget.totalAmount}
          paidAmount={paymentTarget.paidAmount}
          onClose={() => setPaymentTarget(null)}
          onSuccess={loadData}
        />
      )}

      {showExportModal && (
        <CustomerExportModal
          customerId={customer.id}
          customerName={customer.name}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showAdvanceModal && farmId && (
        <AdvancePaymentModal
          farmId={farmId}
          customerId={customer.id}
          customerName={customer.name}
          onClose={() => setShowAdvanceModal(false)}
          onSuccess={loadBalance}
        />
      )}

      {showAdjustmentModal && farmId && (
        <BalanceAdjustmentModal
          farmId={farmId}
          customerId={customer.id}
          customerName={customer.name}
          onClose={() => setShowAdjustmentModal(false)}
          onSuccess={loadBalance}
        />
      )}
    </div>
  );
}

function BalanceHistoryTable({
  transactions,
}: {
  transactions: CustomerBalanceTransaction[];
}): React.ReactElement {
  const sortedAsc = transactions
    .slice()
    .sort((a, b) => {
      const da = new Date((a as any).date ?? "").getTime();
      const db = new Date((b as any).date ?? "").getTime();
      if (da !== db) return da - db;
      return Number(a.id) - Number(b.id);
    });

  const runningById = new Map<number, number>();
  let running = 0;
  for (const t of sortedAsc) {
    running += Number((t as any).amount ?? 0);
    runningById.set(Number(t.id), running);
  }

  const sortedDesc = transactions
    .slice()
    .sort((a, b) => {
      const da = new Date((a as any).date ?? "").getTime();
      const db = new Date((b as any).date ?? "").getTime();
      if (da !== db) return db - da;
      return Number(b.id) - Number(a.id);
    });

  function badge(t: CustomerBalanceTransaction): { label: string; className: string } {
    const type = t.type;
    if (type === "advance_payment" || type === "overpayment") return { label: type === "advance_payment" ? "Advance" : "Overpayment", className: "bg-emerald-50 text-emerald-700" };
    if (type === "adjustment") return { label: "Adjustment", className: "bg-blue-50 text-blue-700" };
    if (type === "applied_to_sale") return { label: "Applied", className: "bg-orange-50 text-orange-700" };
    if (type === "refund") return { label: "Refund", className: "bg-rose-50 text-rose-700" };
    return { label: type, className: "bg-gray-100 text-gray-700" };
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Running</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedDesc.map((t) => {
              const amt = Number((t as any).amount ?? 0);
              const run = runningById.get(Number(t.id)) ?? 0;
              const b = badge(t);
              const ref =
                t.referenceType === "sale" && t.referenceId
                  ? `Sale #${t.referenceId}`
                  : t.referenceType === "manual"
                    ? "Manual"
                    : "—";
              return (
                <tr key={t.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-gray-700">
                    {t.date ? new Date((t as any).date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.className}`}>
                      {b.label}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${amt >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatCurrency(amt)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ref}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[340px] truncate" title={t.notes || ""}>
                    {t.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(run)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
        Running balance is calculated from oldest to newest.
      </p>
    </div>
  );
}
