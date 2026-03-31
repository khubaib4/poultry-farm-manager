import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isElectron, customers as customersApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CUSTOMER_CATEGORIES } from "@/components/customers/CategoryBadge";

const PAYMENT_TERMS_OPTIONS = [
  { value: 0, label: "Cash on Delivery" },
  { value: 7, label: "7 Days Credit" },
  { value: 14, label: "14 Days Credit" },
  { value: 30, label: "30 Days Credit" },
  { value: -1, label: "Custom" },
];

export default function EditCustomerPage(): React.ReactElement {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const id = Number(customerId);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("individual");
  const [paymentTerms, setPaymentTerms] = useState(0);
  const [customTerms, setCustomTerms] = useState("");
  const [defaultPricePerEgg, setDefaultPricePerEgg] = useState("");
  const [defaultPricePerTray, setDefaultPricePerTray] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeactivate, setShowDeactivate] = useState(false);

  useEffect(() => {
    if (!isElectron() || !id) return;
    (async () => {
      try {
        const data = await customersApi.getById(id);
        setName(data.name);
        setPhone(data.phone || "");
        setBusinessName(data.businessName || "");
        setAddress(data.address || "");
        setCategory(data.category);
        setIsActive(data.isActive === 1);
        setNotes(data.notes || "");
        setDefaultPricePerEgg(data.defaultPricePerEgg != null ? String(data.defaultPricePerEgg) : "");
        setDefaultPricePerTray(data.defaultPricePerTray != null ? String(data.defaultPricePerTray) : "");

        const terms = data.paymentTermsDays ?? 0;
        const isStandard = [0, 7, 14, 30].includes(terms);
        if (isStandard) {
          setPaymentTerms(terms);
        } else {
          setPaymentTerms(-1);
          setCustomTerms(String(terms));
        }
      } catch (err) {
        showToast("Failed to load customer", "error");
        navigate("/farm/customers");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (!isElectron()) {
    return <div className="p-6 text-center text-gray-500">This feature is only available in the desktop app.</div>;
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "Name is required (min 2 characters)";
    if (!category) errs.category = "Category is required";
    if (defaultPricePerEgg && (isNaN(Number(defaultPricePerEgg)) || Number(defaultPricePerEgg) < 0)) {
      errs.defaultPricePerEgg = "Must be a positive number";
    }
    if (defaultPricePerTray && (isNaN(Number(defaultPricePerTray)) || Number(defaultPricePerTray) < 0)) {
      errs.defaultPricePerTray = "Must be a positive number";
    }
    if (paymentTerms === -1 && (!customTerms || isNaN(Number(customTerms)) || Number(customTerms) < 0)) {
      errs.customTerms = "Enter a valid number of days";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;

    try {
      setSaving(true);
      const terms = paymentTerms === -1 ? Number(customTerms) : paymentTerms;
      await customersApi.update(id, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        businessName: businessName.trim() || undefined,
        address: address.trim() || undefined,
        category,
        paymentTermsDays: terms,
        defaultPricePerEgg: defaultPricePerEgg !== "" ? Number(defaultPricePerEgg) : null,
        defaultPricePerTray: defaultPricePerTray !== "" ? Number(defaultPricePerTray) : null,
        notes: notes.trim() || undefined,
      });
      showToast("Customer updated successfully", "success");
      navigate(`/farm/customers/${id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update customer", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    try {
      await customersApi.update(id, { isActive: isActive ? 0 : 1 });
      showToast(isActive ? "Customer deactivated" : "Customer reactivated", "success");
      navigate("/farm/customers");
    } catch (err) {
      showToast("Failed to update customer status", "error");
    }
    setShowDeactivate(false);
  }

  if (loading) return <LoadingSpinner size="lg" text="Loading customer..." />;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Edit Customer"
        backTo={`/farm/customers/${id}`}
        icon={<Users className="h-6 w-6" />}
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.name ? "border-red-300" : "border-gray-300"}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            {CUSTOMER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
          <select
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
          >
            {PAYMENT_TERMS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {paymentTerms === -1 && (
            <div className="mt-2">
              <input
                type="number"
                value={customTerms}
                onChange={(e) => setCustomTerms(e.target.value)}
                placeholder="Number of days"
                min="0"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.customTerms ? "border-red-300" : "border-gray-300"}`}
              />
              {errors.customTerms && <p className="text-xs text-red-500 mt-1">{errors.customTerms}</p>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Price/Egg</label>
            <input
              type="number"
              value={defaultPricePerEgg}
              onChange={(e) => setDefaultPricePerEgg(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.defaultPricePerEgg ? "border-red-300" : "border-gray-300"}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Price/Tray</label>
            <input
              type="number"
              value={defaultPricePerTray}
              onChange={(e) => setDefaultPricePerTray(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.defaultPricePerTray ? "border-red-300" : "border-gray-300"}`}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={() => setShowDeactivate(true)}
            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isActive
                ? "text-red-700 bg-red-50 hover:bg-red-100"
                : "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
            }`}
          >
            {isActive ? "Deactivate" : "Reactivate"}
          </button>
          <button
            onClick={() => navigate(`/farm/customers/${id}`)}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeactivate}
        title={isActive ? "Deactivate Customer" : "Reactivate Customer"}
        message={
          isActive
            ? "This customer will be marked as inactive and hidden from the active list. You can reactivate them later."
            : "This customer will be marked as active again."
        }
        confirmText={isActive ? "Deactivate" : "Reactivate"}
        variant={isActive ? "danger" : "info"}
        onConfirm={handleToggleActive}
        onCancel={() => setShowDeactivate(false)}
      />
    </div>
  );
}
