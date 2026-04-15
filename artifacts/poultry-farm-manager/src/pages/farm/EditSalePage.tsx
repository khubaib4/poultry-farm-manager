import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, customers as customersApi, sales as salesApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Edit2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorState from "@/components/ui/ErrorState";
import SaleItemsInput, { type SaleItemRow } from "@/components/sales/SaleItemsInput";
import DiscountInput from "@/components/sales/DiscountInput";
import SaleSummaryCard from "@/components/sales/SaleSummaryCard";
import {
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
} from "@/lib/salesCalculations";
import type { Customer, SaleDetail } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";

export default function EditSalePage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const farmId = useFarmId();

  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [saleDate, setSaleDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<SaleItemRow[]>([]);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id || !farmId || !isElectron()) { setIsLoading(false); return; }
    Promise.all([
      salesApi.getById(parseInt(id, 10)),
      customersApi.getByFarm(farmId, { status: "active" }),
    ]).then(([saleData, customerData]) => {
      if (saleData.payments && saleData.payments.length > 0) {
        setError("Cannot edit a sale that has payments recorded");
        setIsLoading(false);
        return;
      }
      setSale(saleData);
      setCustomers(customerData);
      setCustomerId(saleData.customerId);
      setSaleDate(saleData.saleDate);
      setDueDate(saleData.dueDate || "");
      setNotes(saleData.notes || "");
      setDiscountType((saleData.discountType as "none" | "percentage" | "fixed") || "none");
      setDiscountValue(saleData.discountValue ? String(saleData.discountValue) : "");

      if (saleData.items && saleData.items.length > 0) {
        setItems(saleData.items.map(i => ({
          itemType: i.itemType as "egg" | "tray",
          grade: i.grade as "A" | "B" | "cracked",
          quantity: String(i.quantity ?? ""),
          unitPrice: String(i.unitPrice ?? ""),
        })));
      }
    }).catch(err => {
      setError(err instanceof Error ? err.message : "Failed to load sale");
    }).finally(() => setIsLoading(false));
  }, [id, farmId]);

  const parsedItems = useMemo(() =>
    items.map(i => ({
      itemType: i.itemType as "egg" | "tray",
      grade: i.grade as "A" | "B" | "cracked",
      quantity: parseFloat(i.quantity) || 0,
      unitPrice: parseFloat(i.unitPrice) || 0,
    })),
  [items]);

  const subtotal = useMemo(() => calculateSubtotal(parsedItems), [parsedItems]);
  const discountAmount = useMemo(
    () => calculateDiscount(subtotal, discountType, parseFloat(discountValue) || 0),
    [subtotal, discountType, discountValue]
  );
  const total = useMemo(() => calculateTotal(subtotal, discountAmount), [subtotal, discountAmount]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = "Customer is required";
    if (!saleDate) errs.saleDate = "Sale date is required";
    const validItems = parsedItems.filter(i => i.quantity > 0 && i.unitPrice > 0);
    if (validItems.length === 0) errs.items = "At least one item with quantity and price is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate() || !farmId || !sale) return;

    try {
      setIsSubmitting(true);
      const validItems = parsedItems.filter(i => i.quantity > 0 && i.unitPrice > 0);
      await salesApi.update(sale.id, {
        farmId,
        customerId: customerId as number,
        saleDate,
        dueDate: dueDate || undefined,
        items: validItems.map(i => ({
          ...i,
          lineTotal: Math.round(i.quantity * i.unitPrice * 100) / 100,
        })),
        discountType: discountType !== "none" ? discountType : undefined,
        discountValue: discountType !== "none" ? parseFloat(discountValue) || 0 : undefined,
        notes: notes.trim() || undefined,
      });
      showToast("Sale updated successfully", "success");
      navigate(`/farm/sales/${sale.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update sale", "error");
      setIsSubmitting(false);
    }
  }

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  if (isLoading) return <LoadingSpinner size="lg" text="Loading sale..." />;
  if (error) return <ErrorState message={error} onRetry={() => navigate("/farm/sales")} />;
  if (!sale) return <ErrorState message="Sale not found" />;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title={`Edit ${sale.invoiceNumber}`}
        icon={<Edit2 className="h-6 w-6" />}
        actions={
          <button onClick={() => navigate(`/farm/sales/${sale.id}`)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to Sale
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Customer</h3>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value ? parseInt(e.target.value, 10) : "")}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white ${errors.customer ? "border-red-300" : "border-gray-300"}`}
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}{c.businessName ? ` (${c.businessName})` : ""}
              </option>
            ))}
          </select>
          {errors.customer && <p className="text-xs text-red-500">{errors.customer}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Sale Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
              <input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.saleDate ? "border-red-300" : "border-gray-300"}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SaleItemsInput items={items} onChange={setItems} />
          {errors.items && <p className="text-xs text-red-500 mt-2">{errors.items}</p>}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <DiscountInput
            discountType={discountType}
            discountValue={discountValue}
            discountAmount={discountAmount}
            onTypeChange={(t) => { setDiscountType(t); if (t === "none") setDiscountValue(""); }}
            onValueChange={setDiscountValue}
          />
        </div>

        <SaleSummaryCard subtotal={subtotal} discountAmount={discountAmount} total={total} />

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..."
            rows={3} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none" />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate(`/farm/sales/${sale.id}`)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
