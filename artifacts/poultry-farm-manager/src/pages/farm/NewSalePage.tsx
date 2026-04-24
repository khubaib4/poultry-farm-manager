import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { eggCategories as eggCategoriesApi, isElectron, customers as customersApi, sales as salesApi, customerBalance as customerBalanceApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SaleItemsInput, { type CombinedSaleItemRow, type SaleItemRow } from "@/components/sales/SaleItemsInput";
import DiscountInput from "@/components/sales/DiscountInput";
import SaleSummaryCard from "@/components/sales/SaleSummaryCard";
import BankTransferFields from "@/components/shared/BankTransferFields";
import ChequeFields from "@/components/shared/ChequeFields";
import {
  calculateSubtotal,
  calculateDiscount,
  calculateTotal,
  calculateBalanceDue,
  calculateDueDate,
} from "@/lib/salesCalculations";
import type { Customer, EggCategory } from "@/types/electron";
import { useFarmId } from "@/hooks/useFarmId";
import { formatCurrency } from "@/lib/utils";

export default function NewSalePage(): React.ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const farmId = useFarmId();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<EggCategory[]>([]);
  const [customerId, setCustomerId] = useState<number | "">("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerType, setCustomerType] = useState<"existing" | "walkin">("existing");
  const [walkInName, setWalkInName] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [walkInItems, setWalkInItems] = useState<SaleItemRow[]>([
    { category: "", unitType: "tray", quantity: "", unitPrice: "" },
  ]);
  const [existingItems, setExistingItems] = useState<CombinedSaleItemRow[]>([
    { category: "", petiQty: "", trayQty: "", pricePerPeti: "" },
  ]);
  const [discountType, setDiscountType] = useState<"none" | "percentage" | "fixed">("none");
  const [discountValue, setDiscountValue] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [fromBank, setFromBank] = useState("");
  const [toBank, setToBank] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [balanceApplyAmount, setBalanceApplyAmount] = useState<string>("0");
  const [useFullBalance, setUseFullBalance] = useState(false);

  const selectedCustomer = customers.find(c => c.id === customerId);

  useEffect(() => {
    if (!farmId || !isElectron()) return;
    customersApi.getByFarm(farmId, { status: "active" }).then(setCustomers).catch(() => {});
  }, [farmId]);

  useEffect(() => {
    if (!farmId || !isElectron()) return;
    eggCategoriesApi.getAll(farmId).then((cats) => {
      setCategories(cats);
      const active = cats.filter(c => (c.isActive ?? 1) !== 0).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      if (active.length > 0) {
        const first = active[0]!;
        setWalkInItems((prev) => prev.map((i) => (i.category ? i : { ...i, category: first.name })));
        setExistingItems((prev) =>
          prev.map((i) =>
            i.category
              ? i
              : {
                  ...i,
                  category: first.name,
                  pricePerPeti:
                    i.pricePerPeti ||
                    (first.unit === "tray" && Number(first.defaultPrice) > 0
                      ? String(Number(first.defaultPrice) * 12)
                      : Number(first.defaultPrice) > 0
                        ? String(Number(first.defaultPrice))
                        : ""),
                }
          )
        );
      }
    }).catch(() => {});
  }, [farmId]);

  useEffect(() => {
    if (selectedCustomer) {
      const terms = selectedCustomer.paymentTermsDays ?? 0;
      setDueDate(calculateDueDate(saleDate, terms));

      if (selectedCustomer.defaultPricePerEgg != null || selectedCustomer.defaultPricePerTray != null) {
        setItems(prev => prev.map(item => {
          if (item.unitPrice) return item;
          if (item.unitType === "egg" && selectedCustomer.defaultPricePerEgg != null) {
            return { ...item, unitPrice: String(selectedCustomer.defaultPricePerEgg) };
          }
          if (item.unitType === "tray" && selectedCustomer.defaultPricePerTray != null) {
            return { ...item, unitPrice: String(selectedCustomer.defaultPricePerTray) };
          }
          return item;
        }));
      }
    }
  }, [selectedCustomer, saleDate]);

  const parsedItems = useMemo(() => {
    if (customerType === "walkin") {
      return walkInItems.map((i) => ({
        itemType: i.unitType,
        grade: i.category,
        unitType: i.unitType,
        quantity: parseFloat(i.quantity) || 0,
        unitPrice: parseFloat(i.unitPrice) || 0,
        totalEggs: (i.unitType === "peti" ? 360 : i.unitType === "tray" ? 30 : 1) * (parseFloat(i.quantity) || 0),
      }));
    }

    const out: Array<{
      itemType: string;
      grade: string;
      unitType: "egg" | "tray" | "peti";
      quantity: number;
      unitPrice: number;
      totalEggs: number;
    }> = [];

    for (const row of existingItems) {
      const petiQty = Math.max(0, Math.trunc(parseFloat(row.petiQty) || 0));
      const trayQty = Math.max(0, Math.trunc(parseFloat(row.trayQty) || 0));
      const pricePerPeti = Math.max(0, parseFloat(row.pricePerPeti) || 0);
      const trayPrice = pricePerPeti > 0 ? pricePerPeti / 12 : 0;

      if (petiQty > 0) {
        out.push({
          itemType: "peti",
          grade: row.category,
          unitType: "peti",
          quantity: petiQty,
          unitPrice: pricePerPeti,
          totalEggs: petiQty * 360,
        });
      }
      if (trayQty > 0) {
        out.push({
          itemType: "tray",
          grade: row.category,
          unitType: "tray",
          quantity: trayQty,
          unitPrice: trayPrice,
          totalEggs: trayQty * 30,
        });
      }
    }

    return out;
  }, [customerType, walkInItems, existingItems]);

  const subtotal = useMemo(() => calculateSubtotal(parsedItems), [parsedItems]);
  const discountAmount = useMemo(
    () => calculateDiscount(subtotal, discountType, parseFloat(discountValue) || 0),
    [subtotal, discountType, discountValue]
  );
  const total = useMemo(() => calculateTotal(subtotal, discountAmount), [subtotal, discountAmount]);
  const paid = parseFloat(amountPaid) || 0;
  const applied = Math.max(0, parseFloat(balanceApplyAmount) || 0);
  const maxApplicable = Math.max(0, Math.min(creditBalance, total));
  const balanceApplied = Math.min(applied, maxApplicable);
  const amountDueAfterBalance = Math.max(0, total - balanceApplied);
  const effectivePaid = paid + balanceApplied;
  const balance = useMemo(() => calculateBalanceDue(total, effectivePaid), [total, effectivePaid]);

  useEffect(() => {
    if (customerType !== "existing" || !customerId) {
      setCreditBalance(0);
      setBalanceApplyAmount("0");
      setUseFullBalance(false);
      return;
    }
    customerBalanceApi
      .getBalance(customerId as number)
      .then((r: any) => setCreditBalance(Number(r?.balance ?? 0)))
      .catch(() => setCreditBalance(0));
  }, [customerType, customerId]);

  useEffect(() => {
    if (!useFullBalance) return;
    setBalanceApplyAmount(String(Math.min(creditBalance, total)));
  }, [useFullBalance, creditBalance, total]);

  useEffect(() => {
    if (paymentMethod !== "bank_transfer") {
      setFromBank("");
      setToBank("");
    }
  }, [paymentMethod]);

  useEffect(() => {
    if (paymentMethod === "cheque") {
      setChequeDate((d) => d || new Date().toISOString().split("T")[0]);
      return;
    }
    setChequeNumber("");
    setChequeDate("");
    setChequeBank("");
  }, [paymentMethod]);

  const filteredCustomers = customerSearch
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.businessName && c.businessName.toLowerCase().includes(customerSearch.toLowerCase())) ||
        (c.phone && c.phone.includes(customerSearch))
      )
    : customers;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (customerType === "existing" && !customerId) errs.customer = "Customer is required";
    if (!saleDate) errs.saleDate = "Sale date is required";
    const validItems = parsedItems.filter(i => i.grade && i.quantity > 0 && i.unitPrice > 0);
    if (validItems.length === 0) errs.items = "At least one item with quantity and price is required";
    if (discountAmount > subtotal) errs.discount = "Discount cannot exceed subtotal";
    if (paid < 0) errs.amountPaid = "Amount paid cannot be negative";
    if (paid > total) errs.amountPaid = "Amount paid cannot exceed total";
    if (customerType === "existing" && customerId && creditBalance > 0) {
      const raw = Math.max(0, parseFloat(balanceApplyAmount) || 0);
      const max = Math.max(0, Math.min(creditBalance, total));
      if (raw > max) errs.balanceApplyAmount = `Cannot apply more than ${formatCurrency(max)}`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate() || !farmId) return;

    try {
      setIsSubmitting(true);
      const validItems = parsedItems.filter(i => i.grade && i.quantity > 0 && i.unitPrice > 0);
      const bankNote =
        paymentMethod === "bank_transfer" && (fromBank || toBank)
          ? `Bank Transfer: From ${fromBank || "—"} → To ${toBank || "—"}`
          : "";
      const chequeNote =
        paymentMethod === "cheque" && (chequeNumber || chequeDate || chequeBank)
          ? [
              chequeNumber ? `Cheque #${chequeNumber}` : "",
              chequeBank ? `Bank: ${chequeBank}` : "",
              chequeDate ? `Cash Date: ${chequeDate}` : "",
            ]
              .filter(Boolean)
              .join(" | ")
          : "";
      const combinedNotes =
        [notes.trim(), bankNote, chequeNote].filter(Boolean).join("\n") || undefined;
      const result = await salesApi.create({
        farmId,
        customerId: customerType === "existing" ? (customerId as number) : null,
        walkInCustomerName:
          customerType === "walkin" ? (walkInName.trim() || "Walk-in Customer") : "",
        saleDate,
        dueDate: dueDate || undefined,
        items: validItems.map(i => ({
          ...i,
          totalEggs: Math.max(0, Math.trunc(Number(i.totalEggs) || 0)),
          lineTotal: Math.round(i.quantity * i.unitPrice * 100) / 100,
        })),
        discountType: discountType !== "none" ? discountType : undefined,
        discountValue: discountType !== "none" ? parseFloat(discountValue) || 0 : undefined,
        amountPaid: paid > 0 ? paid : undefined,
        paymentMethod: paid > 0 ? paymentMethod : undefined,
        notes: combinedNotes,
      });

      if (customerType === "existing" && customerId && balanceApplied > 0) {
        await customerBalanceApi.applyToSale({
          farmId,
          customerId: customerId as number,
          saleId: result.id,
          amount: balanceApplied,
          date: saleDate,
        });
        await salesApi.recordPayment({
          saleId: result.id,
          amount: balanceApplied,
          paymentDate: saleDate,
          paymentMethod: "credit_balance",
          notes: "Applied customer credit balance",
        } as any);
      }

      toast.success("Sale created successfully");
      navigate(`/farm/sales/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create sale");
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCustomerType("existing");
                setWalkInName("");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                customerType === "existing"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Existing Customer
            </button>
            <button
              type="button"
              onClick={() => {
                setCustomerType("walkin");
                setCustomerId("");
                setCustomerSearch("");
                setShowDropdown(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                customerType === "walkin"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Walk-in Customer
            </button>
          </div>

          {customerType === "existing" ? (
            <>
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

              {selectedCustomer && creditBalance > 0 && (
                <div className="mt-3 bg-emerald-50 border border-emerald-200 border-l-4 border-l-emerald-500 rounded-lg p-4">
                  <p className="text-sm font-medium text-emerald-900">
                    Customer has {formatCurrency(creditBalance)} credit balance
                  </p>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-emerald-900/80 mb-1">Apply to this sale</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-700 text-xs font-medium">PKR</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={balanceApplyAmount}
                          onChange={(e) => {
                            setUseFullBalance(false);
                            setBalanceApplyAmount(e.target.value);
                          }}
                          className={`w-full pl-12 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white ${
                            errors.balanceApplyAmount ? "border-red-300" : "border-emerald-200"
                          }`}
                        />
                      </div>
                      {errors.balanceApplyAmount && <p className="text-xs text-red-600 mt-1">{errors.balanceApplyAmount}</p>}
                      <p className="text-xs text-emerald-800/70 mt-1">
                        Balance after: {formatCurrency(Math.max(0, creditBalance - balanceApplied))}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-emerald-900 select-none">
                      <input
                        type="checkbox"
                        checked={useFullBalance}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setUseFullBalance(checked);
                          if (checked) setBalanceApplyAmount(String(Math.min(creditBalance, total)));
                        }}
                        className="h-4 w-4 accent-emerald-600"
                      />
                      Use full balance
                    </label>
                  </div>
                </div>
              )}

              <button type="button" onClick={() => navigate("/farm/customers/new")} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                + Add New Customer
              </button>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
              <input
                type="text"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="Enter customer name or leave blank for anonymous"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Walk-in customers are not added to your customer list.
              </p>
            </div>
          )}
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
          {categories.filter(c => (c.isActive ?? 1) !== 0).length === 0 && (
            <div className="mb-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              No egg categories found. Add or load defaults in{" "}
              <button
                type="button"
                onClick={() => navigate("/farm/settings/egg-categories")}
                className="underline font-medium"
              >
                Settings → Egg Categories
              </button>
              .
            </div>
          )}
          {customerType === "walkin" ? (
            <SaleItemsInput mode="walkin" items={walkInItems} onChange={setWalkInItems} categories={categories} />
          ) : (
            <SaleItemsInput mode="existing" items={existingItems} onChange={setExistingItems} categories={categories} />
          )}
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

            {paid > 0 && paymentMethod === "bank_transfer" && (
              <BankTransferFields
                fromBank={fromBank}
                toBank={toBank}
                onFromBankChange={setFromBank}
                onToBankChange={setToBank}
              />
            )}

            {paid > 0 && paymentMethod === "cheque" && (
              <ChequeFields
                chequeNumber={chequeNumber}
                chequeDate={chequeDate}
                chequeBank={chequeBank}
                onChequeNumberChange={setChequeNumber}
                onChequeDateChange={setChequeDate}
                onChequeBankChange={setChequeBank}
              />
            )}
          </div>

          <SaleSummaryCard
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
            balanceApplied={balanceApplied}
            amountDue={amountDueAfterBalance}
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
