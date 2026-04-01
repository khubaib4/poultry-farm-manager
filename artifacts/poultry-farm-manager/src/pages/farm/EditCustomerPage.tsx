import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isElectron, customers as customersApi } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Users } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CUSTOMER_CATEGORIES } from "@/components/customers/CategoryBadge";

export default function EditCustomerPage(): React.ReactElement {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const id = Number(customerId);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("individual");
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
      } catch {
        toast.error("Failed to load customer");
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
    if (!phone.trim()) errs.phone = "Phone number is required";
    if (!category) errs.category = "Category is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (saving || !validate()) return;

    setSaving(true);
    try {
      await customersApi.update(id, {
        name: name.trim(),
        phone: phone.trim(),
        businessName: businessName.trim() || undefined,
        address: address.trim() || undefined,
        category,
        notes: notes.trim() || undefined,
      });
      toast.success("Customer updated successfully");
      navigate(`/farm/customers/${id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update customer");
      setSaving(false);
    }
  }

  async function handleToggleActive() {
    try {
      await customersApi.update(id, { isActive: isActive ? 0 : 1 });
      setShowDeactivate(false);
      toast.success(isActive ? "Customer deactivated" : "Customer reactivated");
      navigate("/farm/customers");
    } catch {
      setShowDeactivate(false);
      toast.error("Failed to update customer status");
    }
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none ${errors.phone ? "border-red-300" : "border-gray-300"}`}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
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
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white ${errors.category ? "border-red-300" : "border-gray-300"}`}
          >
            {CUSTOMER_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
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
