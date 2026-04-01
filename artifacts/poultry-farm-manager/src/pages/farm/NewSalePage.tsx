import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isElectron, customers as customersApi, sales as salesApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SaleItemsInput, { type SaleItemRow } from "@/components/sales/SaleItemsInput";
import DiscountInput from "@/components/sales/DiscountInput";
import SaleSummaryCard from "@/components/sales/SaleSummaryCard";
import {
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  calculateBalanceDue,
  calculateDueDate,
} from "@/lib/salesCalculations";
import type { Customer } from "@/types/electron";

export default function NewSalePage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const farmId = user?.farmId ?? null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<SaleItemRow[]>([
    { itemType: "egg", grade: "A", quantity: "", unitPrice: "" },
    { itemType: "egg", grade: "B", quantity: "", unitPrice: "" },
    { itemType: "egg", grade: "cracked", quantity: "", unitPrice: "" },
  ]);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedCustomer = customers.find(c => c.id === customerId);

  useEffect(() => {
    if (!farmId || !isElectron()) return;
    customersApi.getByFarm(farmId, { status: "active" }).then(setCustomers).catch(() => {});
  }, [farmId]);

  useEffect(() => {
    if (selectedCustomer) {
      const terms = selectedCustomer.paymentTermsDays ?? 0;
      setDueDate(calculateDueDate(saleDate, terms));

      if (selectedCustomer.defaultPricePerEgg != null || selectedCustomer.defaultPricePerTray != null) {
        setItems(prev => prev.map(item => {
          if (item.unitPrice) return item;
          if (item.itemType === "egg" && selectedCustomer.defaultPricePerEgg != null) {
            return { ...item, unitPrice: String(selectedCustomer.defaultPricePerEgg) };
          }
          if (item.itemType === "tray" && selectedCustomer.defaultPricePerTray != null) {
            return { ...item, unitPrice: String(selectedCustomer.defaultPricePerTray) };
          }
          return item;
        }));
      }
    }
  }, [selectedCustomer, saleDate]);

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
  const paid = parseFloat(amountPaid) || 0;
  const balance = useMemo(() => calculateBalanceDue(total, paid), [total, paid]);

  const filteredCustomers = customerSearch
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.businessName && c.businessName.toLowerCase().includes(customerSearch.toLowerCase())) ||
        (c.phone && c.phone.includes(customerSearch))
      )
    : customers;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customer = "Customer is required";
    if (!saleDate) errs.saleDate = "Sale date is required";
    const validItems = parsedItems.filter(i => i.quantity > 0 && i.unitPrice > 0);
    if (validItems.length === 0) errs.items = "At least one item with quantity and price is required";
    if (discountAmount > subtotal) errs.discount = "Discount cannot exceed subtotal";
    if (paid < 0) errs.amountPaid = "Amount paid cannot be negative";
    if (paid > total) errs.amountPaid = "Amount paid cannot exceed total";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate() || !farmId) return;

    try {
      setIsSubmitting(true);
      const validItems = parsedItems.filter(i => i.quantity > 0 && i.unitPrice > 0);
      const result = await salesApi.create({
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
        amountPaid: paid > 0 ? paid : undefined,
        paymentMethod: paid > 0 ? paymentMethod : undefined,
        notes: notes.trim() || undefined,
      });
      showToast("Sale created successfully", "success");
      navigate(`/farm/sales/${result.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to create sale", "error");
      setIsSubmitting(false);
    }
  }

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <PageHeader
        title="New Sale"
        icon={<ShoppingCart className="h-6 w-6" />}
        actions={
          <button onClick={() => navigate("/farm/sales")} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to Sales
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Customer</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Search customer by name, phone, or business..."
              value={selectedCustomer ? selectedCustomer.name + (selectedCustomer.businessName ? ` (${selectedCustomer.businessName})` : "") : customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setCustomerId("");
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.customer ? "border-red-300" : "border-gray-300"}`}
            />
            {showDropdown && filteredCustomers.length > 0 && !selectedCustomer && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearch("");
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.businessName && <span className="text-gray-500 ml-1">({c.businessName})</span>}
                    {c.phone && <span className="text-gray-400 ml-2">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
            {errors.customer && <p className="text-xs text-red-500 mt-1">{errors.customer}</p>}
          </div>
          {selectedCustomer && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Terms: {selectedCustomer.paymentTermsDays === 0 ? "Cash" : `Net ${selectedCustomer.paymentTermsDays}`}</span>
              {selectedCustomer.defaultPricePerEgg != null && <span>Egg: PKR {selectedCustomer.defaultPricePerEgg}</span>}
              {selectedCustomer.defaultPricePerTray != null && <span>Tray: PKR {selectedCustomer.defaultPricePerTray}</span>}
              <button type="button" onClick={() => { setCustomerId(""); setCustomerSearch(""); }} className="text-red-500 hover:text-red-700 ml-auto">Clear</button>
            </div>
          )}
          <button type="button" onClick={() => navigate("/farm/customers/new")} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            + Add New Customer
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Sale Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.saleDate ? "border-red-300" : "border-gray-300"}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
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
          {errors.discount && <p className="text-xs text-red-500 mt-2">{errors.discount}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Payment</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid Now</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.amountPaid ? "border-red-300" : "border-gray-300"}`}
              />
              {errors.amountPaid && <p className="text-xs text-red-500 mt-1">{errors.amountPaid}</p>}
            </div>
            {paid > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online Payment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}
          </div>

          <SaleSummaryCard
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
            amountPaid={paid}
            balanceDue={balance}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <button type="button" onClick={() => navigate("/farm/sales")} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}
